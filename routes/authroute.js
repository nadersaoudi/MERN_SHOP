const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

//Check validator for requests
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');


//Models
const User = require('../models/User');

//@rout POST API/USER/REGISTER
//@desc Register User
//@Access Public
router.post('/register', [
    //Validation
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password a 6 or more characters').isLength({
        min: 6
    })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }
    //get name, email, password from request 
    const { name, email, password } = req.body;

    try {
        //Check if user already exist 
        let user = await User.findOne({ email });

        //If user exist 
        if (user) {
            return res.status(400).json({
                errors: [
                    {
                        msg: 'User already exists',
                    },
                ],
            });
        }

        //If not exists 
        //get image from gravatar 
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        //Create user object 
        user = new User({
            name, email, avatar, password
        })

        //Encrypt password 
        const salt = await bcrypt.genSalt(10); //generate salt contains 10
        //save password 
        user.password = await bcrypt.hash(password, salt); //use user password and salt to hash password 
        //save user in data 
        await user.save();

        //payload to generate token 
        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: 360000, // for development for production it will 3600
            },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (error) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
}
);


module.exports = router