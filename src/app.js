const express = require('express');
const twilio = require('twilio');

const session = require('express-session');

require('dotenv').config();
const path = require('path')
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: "gmail",


    auth: {
        user: "proavail.service@gmail.com",
        pass: "wtlu geeq avup vnvx"
    },
    debug: true,
});
transporter.verify((error, success) => {
    if (error) {
        console.log(error)
    }
    else {
        console.log("ready for messages"),
            console.log(success);
    }
})
const app = express();

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 3000;
const hbs = require("hbs");
require("./db/conn");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());



const Register = require("./models/registers");
const query = require("./models/query");
const member = require("./models/providers");
const SMTPConnection = require('nodemailer/lib/smtp-connection');
const connectDB = require('./db/conn');
const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(static_path));
app.set("view engine", "hbs");
app.set("views", template_path);
hbs.registerPartials(partials_path);


const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
connectDB()

// Create a Twilio client
const client = new twilio(accountSid, authToken);
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isAuthenticated || false;
    next();
});
// Route to send OTP


app.get('/', (req, res) => {
    res.render("index")
})

app.get("/index", async (req, res) => {
    res.render("index",{message:null});
});

app.get('/change-password', (req, res) => {
    res.render("change-password")
})

app.get('/login', (req, res) => {
    const phoneNumber = req.cookies.phoneNumber || '';
    res.render('login', { phoneNumber });

});
app.get('/otp-verification', (req, res) => {
    res.render("otp-verification")
})
app.get('/authentication', (req, res) => {
    res.render("authentication")
})


app.get("/about", (req, res) => {
    res.render("about")
});
app.get("/contact", (req, res) => {
    res.render("contact")
});

app.get("/provider_signup", (req, res) => {
    res.render("provider_signup")
});
app.get("/seeker_signup", (req, res) => {
    res.render("seeker_signup")
});
app.get("/signup", (req, res) => {
    res.render("signup")
});
app.get('/logout', (req, res) => {
    // Destroy the session
    setTimeout(() => {
        req.session.destroy(err => {
            if (err) {
                console.log(err);
            } else {
                // Redirect to the index page
                res.render("index", { message: true });
            }
        });
    }, 1000);
});

app.post("/contact", async (req, res) => {
    try {

        const inquiry = new query(
            {
                name: req.body.name,
                email: req.body.email,
                message: req.body.message,
            }
        )
        const submit = await inquiry.save();
        const to = req.body.email;
        const text = req.body.message;

        console.log(text);
        const mailOptions = {
            from: "proavail.service@gmail.com",
            to: to,
            subject: "Thank you!! Your query has been successfully submitted ",
            html: `<p><b>The submitted inquiry is: </b>${text}</p>
           <p>We appreciate your interest. Our team will get back to you soon.</p>`
        };
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log("Email sent:", info.response);
            res.status(201).render("post-inquiry");
        } catch (error) {
            console.error("Error sending email:", error);
            res.status(500).send("Internal Server Error");
        }


    }

    catch (error) {
        res.status(400).send(error);
    }
});

app.post("/provider_signup", async (req, res) => {
    try {
        const password = req.body.password;
        const cpassword = req.body.confirmPassword;
        if (password === cpassword) {
            const provider = new member(
                {
                    fullName: req.body.fullName,
                    phoneNumber: req.body.phoneNumber,
                    Address: req.body.Address,
                    profileImage: req.body.profileImage,
                    services: req.body.options,
                    password: password,

                    confirmPassword: cpassword,
                    preferredTiming: req.body.preferredTiming,
                    city: req.body.city
                }
            )
            const sign = await provider.save();
            res.status(201).render("thank");
        }
        else {
            res.send("password not matching");
        }

    } catch (error) {
        res.status(400).send(error);
    }
});


app.post("/seeker_signup", async (req, res) => {
    try {
        const password = req.body.password;
        const cpassword = req.body.confirmPassword;
        if (password === cpassword) {
            const seeker = new Register(
                {
                    fullName: req.body.fullName,
                    phoneNumber: req.body.phoneNumber,
                    Address: req.body.Address,

                    password: password,

                    confirmPassword: cpassword,

                    city: req.body.city
                }
            )
            const signed = await seeker.save();
            res.status(201).render("thank");
        }
        else {
            res.send("password not matching");
        }

    } catch (error) {
        res.status(400).send(error);
    }
});

app.get("/tr", async (req, res) => {
    try {
        // Get the selected service from the query parameters
        const selectedService = req.query.service;

        // Check if a service is selected
        if (selectedService === "all") {
            // If a service is selected, filter the data based on the selected service
            const providerdata = await member.find();
            res.render("tr", { providerdata, selectedService: "All" });

        } else {
            // If no service is selected, retrieve all data
            // "All" can be used as a default value
            const providerdata = await member.find({ services: { $regex: new RegExp(selectedService, 'i') } });
            res.render("tr", { providerdata, selectedService });
        }
    } catch (error) {
        res.send(error);
    }
});
app.post("/login", async (req, res) => {
    try {
        const phoneNumber = req.body.phoneNumber;
        const password = req.body.password;
        const rememberMe = req.body.rememberMe;
        console.log(phoneNumber)
        console.log(password)
        const user = await Register.findOne({ phoneNumber }) || await member.findOne({ phoneNumber })
        if (user) {
            if (rememberMe) {
                // Set cookie to remember phone number
                res.cookie('phoneNumber', phoneNumber, { maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days
            }
            if (user.password === password) {
                req.session.isAuthenticated = true;
                req.session.user = user;
                console.log(req.session);
                res.render("successful", { userName: user.fullName, userid: user._id })

            }
            else {
                res.render("login", { errorMessage: "Incorrect password. Please confirm your password.", phoneNumber });
            }
        }


        else {
            res.render("login", { errorMessage: "Incorrect phone number entered." });
        }


    } catch (error) {
        res.render("login", { errorMessage: "An error occurred. Please try again." });
    }
})

app.post('/otp-verification', async (req, res) => {
    const otp = req.body.otp;
    const phoneNumber = req.body.phoneNumber;
    console.log(otp)
    const otpInput = req.body.otpInput;
    if (otpInput === otp) {
        res.render("change-password", { phoneNumber: phoneNumber })
    }
    else {
        res.render("otp-verification", { Message: "Wrong OTP entered. Try Again!!", phoneNumber: phoneNumber, otp: otp })
    }

})
app.get('/profile', async (req, res) => {
    const userId = req.session.user._id; // Assuming _id is the identifier for users

    try {
        const user = await Register.findOne({ _id: userId }) || await member.findOne({ _id: userId });; // Query MongoDB for the user data
        if (user) {
            // If user data is found, render the profile page and pass user data to it
            res.render('profile', { user });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        // Handle any errors that occur during the database query
        console.error('Error retrieving user data:', error);
        res.redirect('/');
    }
});
app.get('/edit-profile', async (req, res) => {
    const userId = req.session.user._id;
    // Assuming _id is the identifier for users

    try {
        const user = await Register.findOne({ _id: userId }) || await member.findOne({ _id: userId });; // Query MongoDB for the user data
        if (user) {
            const userServices = user.services;
            let selectedServicesString = '';

            // Iterate over the array and construct the string
            for (let i = 0; i < userServices.length; i++) {
                if (i > 0) {
                    selectedServicesString += ', ';
                }
                selectedServicesString += userServices[i];
            }
            console.log(selectedServicesString)
            // If user data is found, render the profile page and pass user data to it
            res.render('edit-profile', { user, selectedServicesString });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        // Handle any errors that occur during the database query
        console.error('Error retrieving user data:', error);
        res.redirect('/');
    }
});
app.get('/change', async (req, res) => {
    const userId = req.session.user._id;
    // Assuming _id is the identifier for users

    try {
        const user = await Register.findOne({ _id: userId }) || await member.findOne({ _id: userId });; // Query MongoDB for the user data
        if (user) {
            // If user data is found, render the profile page and pass user data to it
            res.render('change', { user });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        // Handle any errors that occur during the database query
        console.error('Error retrieving user data:', error);
        res.redirect('/');
    }
});

// Import necessary modules and setup Express app

// Your existing code...
app.get('/success', (req, res) => {
    res.render("success")
})

app.post('/change-password', async (req, res) => {
    try {
        const phoneNumber = req.body.phoneNumber;
        const newPassword = req.body.newPassword;
        const confirmPassword = req.body.confirmPassword;


        // Update the user's password and confirmPassword in the database
        const user = await Register.findOneAndUpdate(
            { phoneNumber: phoneNumber },
            { $set: { password: newPassword, confirmPassword: confirmPassword } },
            { new: true } // Return the updated document
        ) || await member.findOneAndUpdate(
            { phoneNumber: phoneNumber },
            { $set: { password: newPassword, confirmPassword: confirmPassword } },
            { new: true } // Return the updated document
        );

        if (user) {
            // Password reset successful, you can redirect to a success page
            res.render("success", { userName: user.fullName });
        } else {
            // Handle the case where the user is not found
            console.log('User not found');
            res.render("error", { errorMessage: "User not found" });
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        res.render("error", { errorMessage: "Error resetting password" });
    }
});


// Define route to handle POST requests to edit profile
app.post('/edit-profile', async (req, res) => {
    const userId = req.session.user._id;
    // Retrieve form data from the request body
    const fullName = req.body.fullName;
    const phoneNumberString = req.body.phoneNumber;
    const phoneNumber = parseInt(phoneNumberString);
    const address = req.body.Address;
    const selectedServices = req.body.options;
    console.log(selectedServices);// Assuming 'services' is an array of selected services
    const city = req.body.city;
    const preferredTiming = req.body.preferredTiming;
    const profileImage = req.body.profileImage;



    const user = await Register.findOneAndUpdate(
        { _id: userId },
        { $set: { fullName: fullName, phoneNumber: phoneNumber, Address: address, profileImage: profileImage, city: city } },
        { new: true } // Return the updated document
    ) || await member.findOneAndUpdate(
        { _id: userId },
        { $set: { fullName: fullName, phoneNumber: phoneNumber, Address: address, profileImage: profileImage, city: city, services: selectedServices, preferredTiming: preferredTiming } },
        { new: true } // Return the updated document
    );
    if (user) {
        // Password reset successful, you can redirect to a success page
        res.render("profile", { user,profileChanged: true });
    } else {
        // Handle the case where the user is not found
        console.log('User not found');
        res.render("error", { errorMessage: "User not found" });
    }


});
app.post('/change', async (req, res) => {
    const userId = req.session.user._id;
    // Retrieve form data from the request body
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    

    const user = await Register.findOneAndUpdate(
        { _id: userId },
        { $set: { password:password,confirmPassword:confirmPassword } },
        { new: true } // Return the updated document
    ) || await member.findOneAndUpdate(
        { _id: userId },
        { $set: { password:password,confirmPassword:confirmPassword } },
        { new: true } // Return the updated document
    );
    if (user) {
        // Password reset successful, you can redirect to a success page
        res.render("profile", { user,passwordChanged: true });
    } else {
        // Handle the case where the user is not found
        console.log('User not found');
        res.render("error", { errorMessage: "User not found" });
    }


});



// Your remaining code...

app.post('/authentication', async (req, res) => {

    const phoneInput = req.body.phoneNumber;


    const user = await Register.findOne({ phoneNumber: phoneInput }) || await member.findOne({ phoneNumber: phoneInput });

    if (user != null) {
        const to = '+91' + phoneInput;

        // Generate a random OTP
        //const otp = Math.floor(1000 + Math.random() * 9000);
        const otp = 1234;
        // Message body with OTP
        const messageBody = `Your OTP is: ${otp}`;

        // Send SMS
        client.messages.create({
            body: messageBody,
            from: twilioPhoneNumber,
            to: to,
        });
        res.render("otp-verification", { phoneNumber: phoneInput, Message: "OTP Sent", otp });

    } else {
        console.log('User not found in the database');
        res.render("authentication", { errorMessage: "Phone number entered is not registered." });
    }

}
);





app.get("*", (req, res) => {
    res.send("404 error page")
});


app.listen(3000, () => {
    console.log(`listening on the port ${port}`)
})
