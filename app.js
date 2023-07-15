require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20");
const findOrCreate = require("mongoose-findorcreate");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {
        done(null, user);
    }).catch((err) => {
        done(err, null);
    });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function(err, user) {
            return cb(err, user);
        });
}));

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login")
});

app.post("/login", (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, (err) => {
        if (err) {
            res.redirect("/login");
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            })
        }
    })
});

app.get("/register", (req, res) => {
    res.render("register")
});

app.post("/register", (req, res) => {
    User.register({username: req.body.username}, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });
});

app.get("/secrets", (req, res) => {
    User.find({"secret": {$ne:null}}).then((user) => {
        res.render("secrets", {usersWithSecrets: user});
    }).catch((err) => {
        res.send(err);
    })
});

app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            res.redirect("/");
        } else {
            res.redirect("/");
        }
    });
});

app.get("/auth/google", 
    passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/secrets", 
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
        res.redirect("/secrets");
});

app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", (req, res) => {
    const submittedSecret = req.body.secret;
    User.findById(req.user.id).then((user) => {
        if (user) {
            user.secret = submittedSecret;
            user.save().then(() => {
                res.redirect("/secrets");
            });
        }
    }).catch((err) => {
        res.send(err);
    })
})

app.listen(3000, () => {
    console.log("Server started on port 3000.");
});