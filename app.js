const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});

const userSchema = {
    email: String,
    password: String
}
const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login")
});

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne(
        {email: username}
    ).then((foundUser) => {
        if (foundUser.password === password) {
            res.render("secrets");
        } else {
            res.send("Wrong username or password");
        }
    }).catch((err) => {
        res.send("Wrong username or password");
    })
})

app.get("/register", (req, res) => {
    res.render("register")
});

app.post("/register", (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save().then(() => {
        res.render("secrets");
    }).catch((err) => {
        res.send(err);
    });
})

app.listen(3000, () => {
    console.log("Server started on port 3000.");
});