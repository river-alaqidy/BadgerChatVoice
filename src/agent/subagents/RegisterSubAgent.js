import { isLoggedIn, ofRandom } from "../Util";

const createRegisterSubAgent = (end) => {

    let stage;
    let username, password, repeatPassword;

    const handleInitialize = async (promptData) => {
        if (await isLoggedIn()) {
            return end({msg:"You are already logged in, try logging out first.", emote:"error"})
        } else {
            stage = "FOLLOWUP_USERNAME";
            return ofRandom([
                "Sure, what username would you like to use?",
                "Alright, please enter a username."
            ])
        }

    }

    const handleReceive = async (prompt) => {
        switch(stage) {
            case "FOLLOWUP_USERNAME": return await handleFollowupUsername(prompt);
            case "FOLLOWUP_PASSWORD": return await handleFollowupPassword(prompt);
            case "FOLLOWUP_REPEATPASSWORD": return await handleFollowupRepeatPassword(prompt);
        }

    }

    const handleFollowupUsername = async (prompt) => {
        username = prompt;
        stage = "FOLLOWUP_PASSWORD";
        return { msg: "Great, what password would you like to use?", nextIsSensitive: true };
    }

    const handleFollowupPassword = async (prompt) => {
        password = prompt;
        stage = "FOLLOWUP_REPEATPASSWORD"
        return { msg: "Okay, please confirm password.", nextIsSensitive: true };   
    }

    const handleFollowupRepeatPassword = async (prompt) => {
        repeatPassword = prompt;
        if (repeatPassword !== password) {
            return end({msg:"Passwords do not match! Please try again.", emote:"error"})
        }
        const resp = await fetch("https://cs571.org/api/s24/hw11/register", {
            method: "POST",
            credentials: "include",
            headers: {
                "X-CS571-ID": CS571.getBadgerId(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
        
        if (resp.status === 200) {
            return end({msg:"Successfully registered! You are now logged in",emote:"SUCCESS"})
            
        } else if (resp.status == 409){
            return end({msg:"Sorry, that username already exixts, please try again.",emote:"error"})
        }   
        
         
    }

    return {
        handleInitialize,
        handleReceive
    }
}

export default createRegisterSubAgent;