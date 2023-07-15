require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
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
        bcrypt.compare(password, foundUser.password, (error, result) => {
            if (result) {
                res.render("secrets");
            } else {
                res.send("Wrong username or password");
            }
        });
    }).catch((err) => {
        res.send("Wrong username or password");
    })
});

app.get("/register", (req, res) => {
    res.render("register")
});

app.post("/register", (req, res) => {
    bcrypt.hash(req.body.password, saltRounds, (error, hash) => {
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
        newUser.save().then(() => {
            res.render("secrets");
        }).catch((err) => {
            res.send(err);
        });
    })
});

app.listen(3000, () => {
    console.log("Server started on port 3000.");
});