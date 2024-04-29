import createChatDelegator from "./ChatDelegator";
import { isLoggedIn, ofRandom } from "./Util"

const createChatAgent = () => {
    const CS571_WITAI_ACCESS_TOKEN = "LMMYB24S4FSH3HSYEALAKDDSYT4ZZU2Q";

    const delegator = createChatDelegator();

    let chatrooms = [];

    const handleInitialize = async () => {
        const resp = await fetch("https://cs571.org/api/s24/hw11/chatrooms", {
            headers: {
                "X-CS571-ID": CS571.getBadgerId()
            }
        });
        const data = await resp.json();
        chatrooms = data;

        return "Welcome to BadgerChat! My name is Bucki, how can I help you?";
    }

    const handleReceive = async (prompt) => {
        if (delegator.hasDelegate()) { return delegator.handleDelegation(prompt); }
        const resp = await fetch(`https://api.wit.ai/message?q=${encodeURIComponent(prompt)}`, {
            headers: {
                "Authorization": `Bearer ${CS571_WITAI_ACCESS_TOKEN}`
            }
        })
        const data = await resp.json();
        if (data.intents.length > 0) {
            switch (data.intents[0].name) {
                case "get_help": return handleGetHelp();
                case "get_chatrooms": return handleGetChatrooms();
                case "get_messages": return handleGetMessages(data);
                case "login": return handleLogin();
                case "register": return handleRegister();
                case "create_message": return handleCreateMessage(data);
                case "logout": return handleLogout();
                case "whoami": return handleWhoAmI();
            }
        }
        return "Sorry, I didn't get that. Type 'help' to see what you can do!";
    }

    const handleTranscription = async (rawSound, contentType) => {
        const resp = await fetch(`https://api.wit.ai/dictation`, {
            method: "POST",
            headers: {
                "Content-Type": contentType,
                "Authorization": `Bearer ${CS571_WITAI_ACCESS_TOKEN}`
            },
            body: rawSound
        })
        const data = await resp.text();
        const transcription = data
            .split(/\r?\n{/g)
            .map((t, i) => i === 0 ? t : `{${t}`)  // Turn the response text into nice JS objects
            .map(s => JSON.parse(s))
            .filter(chunk => chunk.is_final)       // Only keep the final transcriptions
            .map(chunk => chunk.text)
            .join(" ");                            // And conjoin them!
        return transcription;
    }

    const handleSynthesis = async (txt) => {
        if (txt.length > 280) {
            return undefined;
        } else {
            const resp = await fetch(`https://api.wit.ai/synthesize`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "audio/wav",
                    "Authorization": `Bearer ${CS571_WITAI_ACCESS_TOKEN}`
                },
                body: JSON.stringify({
                    q: txt,
                    voice: "Rebecca",
                    style: "soft"
                })
            })
            const audioBlob = await resp.blob()
            return URL.createObjectURL(audioBlob);
        }
    }

    const handleGetHelp = async () => {
        const helpResponses = ["Try asking 'give me a list of chatrooms', or ask for more help!",
                "Try asking 'register for an account', or ask for more help!",
                "Try asking 'tell me the latest 3 messages', or ask for more help!"];
        return ofRandom(helpResponses);
    }

    const handleGetChatrooms = async () => {
        return ofRandom([`Of course, there are ${chatrooms.length} chatrooms: ${chatrooms.join(", ")}`, 
            `The chatrooms available are: ${chatrooms.join(", ")}`]);
    }

    const handleGetMessages = async (data) => {
        const hasSpecifiedNumber = data.entities["wit$number:number"] ? true : false;
        const numMsgs = hasSpecifiedNumber ? data.entities["wit$number:number"][0].value : 1;
        const hasChatroom = data.entities["chatroom_names:chatroom_names"] ? true : false;
        let url = "https://cs571.org/api/s24/hw11/messages";
        
        if (hasChatroom) {
            url += `?chatroom=${data.entities["chatroom_names:chatroom_names"][0].value}`;
        } 
        if (hasSpecifiedNumber) {
            if (hasChatroom) {
                url += `&num=${numMsgs}`;
            } else {
                url += `?&num=${numMsgs}`;
            }
        }
        const resp = await fetch(url, {
            headers: {
                "X-CS571-ID": CS571.getBadgerId()
            }
        });

        const messages = await resp.json();
        return messages.messages.map(msg => `In ${msg.chatroom}, ${msg.poster} created a post titled '${msg.title}' saying '${msg.content}'`);
    }

    const handleLogin = async () => {
        return await delegator.beginDelegation("LOGIN");
    }

    const handleRegister = async () => {
        return await delegator.beginDelegation("REGISTER");
    }

    const handleCreateMessage = async (data) => {
        return await delegator.beginDelegation("CREATE", data);
    }

    const handleLogout = async () => {
        if (!(await isLoggedIn())) {
            return ofRandom([
                "You must be logged in to logout!", 
                "You need to be logged in before logging out!"
            ])
        } else {
            const resp = await fetch("https://cs571.org/api/s24/hw11/logout", {
                method: "POST",
                credentials: "include",
                headers: {
                    "X-CS571-ID": CS571.getBadgerId()
                }
            })
            const body = await resp.json();
            return body.msg;
        }
    }

    const handleWhoAmI = async () => {
        const resp = await fetch("https://cs571.org/api/s24/hw11/whoami", {
            credentials: "include",
            headers: {
                "X-CS571-ID": CS571.getBadgerId()
            }
        })
        const body = await resp.json();
        if (body.isLoggedIn) {
            return ofRandom([
                `You are currently logged in as ${body.user.username}`, 
                `You are logged in as ${body.user.username}`
            ])
        } else {
            return ofRandom([
                "You are not logged in.", 
                "Sorry, please log in first."
            ])
        }
        
    }

    return {
        handleInitialize,
        handleReceive,
        handleTranscription,
        handleSynthesis
    }
}

export default createChatAgent;