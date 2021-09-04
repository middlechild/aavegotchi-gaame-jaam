function Auth() {

    let moralisUser = Moralis.User.current();

    this.logIn = async function() {
        if (!moralisUser) {
            moralisUser = await Moralis.Web3.authenticate();
            window.game.launch(moralisUser);
        }
        console.log("logged in user:", moralisUser);
    }

    this.logOut = async function() {
        await Moralis.User.logOut();
        console.log("logged out");
        location.reload();
    }

    this.getUser = function() {
        return moralisUser;
    }

    document.getElementById("btn-login").onclick = this.logIn;
    document.getElementById("btn-logout").onclick = this.logOut;
}