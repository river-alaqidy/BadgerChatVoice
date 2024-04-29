import { isLoggedIn, ofRandom } from "../Util";

const createPostSubAgent = (end) => {

    let stage;
    let title, content, chatroom;
    const CS571_WITAI_ACCESS_TOKEN = "LMMYB24S4FSH3HSYEALAKDDSYT4ZZU2Q";

    const handleInitialize = async (promptData) => {
        const hasChatroom = promptData.entities["chatroom_names:chatroom_names"] ? true : false;
        chatroom = hasChatroom ? promptData.entities["chatroom_names:chatroom_names"][0].value : "none";

        if (!(await isLoggedIn())) {
            return end({msg:"Sorry, you must be logged in to make a post!", emote:"error"})
            
        } else {
            if (!hasChatroom) {
                return end({msg:"Sorry, please specify the chatroom you want to post in.", emote:"error"})
            } else {
                stage = "FOLLOWUP_TITLE";
                return ofRandom([
                    "Sounds good. What would you like your title to be?",
                    "Sure, what is the title of the post?"
                ])
            }
        }
    }

    const handleReceive = async (prompt) => {
        switch(stage) {
            case "FOLLOWUP_TITLE": return await handleFollowupTitle(prompt);
            case "FOLLOWUP_CONTENT": return await handleFollowupContent(prompt);
            case "FOLLOWUP_CONFIRMATION": return await handleFollowupConfirmation(prompt);
        }
    }

    const handleFollowupTitle = async (prompt) => {
        title = prompt;
        stage = "FOLLOWUP_CONTENT";
        return ofRandom([
            "Alright, what should be the content of your post?",
            "What will the content of your post be?"
        ])
    }

    const handleFollowupContent = async (prompt) => {
        content = prompt;
        stage = "FOLLOWUP_CONFIRMATION";
        return ofRandom([
            `All ready! To confirm, you want to create a post titled '${title}' in ${chatroom}?`,
            `Please confirm that you want to create a post titled '${title}' in ${chatroom}`
        ])
    }

    const handleFollowupConfirmation = async (prompt) => {
        confirm = prompt;
        const resp = await fetch(`https://api.wit.ai/message?q=${encodeURIComponent(prompt)}`, {
            headers: {
                "Authorization": `Bearer ${CS571_WITAI_ACCESS_TOKEN}`
            }
        })
        const data = await resp.json();
        if (data.intents.length > 0 && data.intents[0].name === 'wit$confirmation') {
            await fetch(`https://cs571.org/api/s24/hw11/messages?chatroom=${chatroom}`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "X-CS571-ID": CS571.getBadgerId(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: title,
                    content: content
                })
            })
            return end({msg:"Successfully posted a message!",emote:"SUCCESS"})
        } else {
            return end(ofRandom([
                "No worries, if you want to create a post in the future, just ask!",
                "That's alright, if you want to create a message in the future, just ask!"
            ]))
        }

    }

    return {
        handleInitialize,
        handleReceive
    }
}

export default createPostSubAgent;