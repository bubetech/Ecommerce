import express, { Router } from "express";
import serverless from "serverless-http";

const api = express();

const router = Router();
// router.get("/hello", (req, res) => res.send("Hello World!"));



import bcrypt from "bcrypt";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore , doc , collection, setDoc, getDoc, getDocs, updateDoc, query, where, deleteDoc, limit } from "firebase/firestore";
import stripe from 'stripe';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCv6IiyNX0II7Z5l-4RhxbcrgIo1uPcn8s",
  authDomain: "ecomm-website-3a6a3.firebaseapp.com",
  projectId: "ecomm-website-3a6a3",
  storageBucket: "ecomm-website-3a6a3.appspot.com",
  messagingSenderId: "317566619521",
  appId: "1:317566619521:web:da18e339392e06f7242280"
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);
const db = getFirestore();

// init server
// const app = express();

// middlewares
api.use(express.static("public"));
api.use(express.json())  // enables form sharing

// aws
import AWS from 'aws-sdk';
import "dotenv/config";


// aws setup
const region = "eu-north-1";
const bucketName = "ecommerce-website-02";
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

AWS.config.update({
    region,
    accessKeyId,
    secretAccessKey
})

//init s3
const s3 = new AWS.S3();

//generate image url 
async function generateURL(){
    let date = new Date();

    const imageName = `${date.getTime()}.jpeg`;

    const params = {
        Bucket: bucketName,
        Key: imageName,
        Expires: 300, // 300mss
        ContentType: "image/jpeg"
    }
    const uploadURL = await s3.getSignedUrlPromise("putObject", params);
    return uploadURL;
}

router.get('/s3url', (req, res) => {
    generateURL().then(url => res.json(url));
});



// routes
// home route
router.get('/', (req, res) => {
    res.sendFile("index.html", {root : "public"})
})

// sign up route
router.get('/signup', (req, res) =>{
    res.sendFile("signup.html", {root : "public"})
})

router.post ('/signup', (req,res) =>{
    const{ name,email,password,number, tac } = req.body;

    // form validation
    if (name.length < 3){
        res.json({'alert': 'name must be 3 letters long'});
     } else if (!email.length){
         res.json({'alert': 'enter your email'});
      } else if (password.length < 8){
         res.json({'alert': 'password must be 8 letters long.'});
      } else if (isNaN(Number(number)) || number.length < 10){
         res.json({'alert':'invalid number, please enter valid one'});
      } else if (!tac){
         res.json({'alert': 'you must agree to our terms and condition'});
      } else{
        // store  the data in db
        const users = collection(db, "users");

        getDoc(doc(users, email)).then(user =>{
            if(user.exists()){
                return res.json({'alert' : 'email already exists'})
            }else{
                // encrypt the password 
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(password, salt, (err,hash)=> {
                        req.body.password = hash;
                        req.body.seller = false;

                        //set the doc 
                        setDoc (doc(users, email), req.body).then(data => {
                            res.json({
                                name:req.body.name,
                                email:req.body.email,
                                seller:req.body.seller,
                            })
                        })
                    })
                })
            }
        })
      }
})

// login route
router.get('/login', (req, res) =>{
    res.sendFile("login.html", {root : "public"})
})

router.post ('/login', (req, res) =>{
    let{ email, password} = req.body;

    if(!email.length || !password.length){
       return res.json ({'alert' : 'fill all the inputs'})
    }
    const users  = collection(db, "users");

    getDoc(doc(users, email))
    .then(user => {
        if (!user.exists()){
            return res.json({'alert' : 'email does not exist'})
        }else{
            bcrypt.compare(password, user.data().password, (err,result) => {
                if(result){
                    let data = user.data();
                    return res.json({
                        name: data.name,
                        email: data.email,
                        seller: data.seller
                    })
                }else {
                    return res.json({'alert' : 'password is incorrect'})
                }
            })
        }
    })
})

// seller route
router.get('/seller', (req, res) =>{
    res.sendFile('seller.html', {root : "public"})
})
router.post('/seller', (req, res) =>{
    let { name, address, number, about, email} = req.body;

    if(!name.length || !address.length || !about.length || number.length < 10 || !Number(number)){
      return  res.json({'alert':'some information(s) is/are incorrect'});
    } else{
        // update seller status 
        const sellers = collection(db, "sellers");
        setDoc(doc(sellers, email), req.body)
        .then(data =>{
            const users = collection(db, "users");
            updateDoc(doc(users, email),{
                seller: true
            })
            .then(data => {
                res.json({'seller' : true})
            })
        })
    }
})

//dashboard route
router.get('/dashboard',(req,res) => {
    res.sendFile('dashboard.html',{root:"public"});
})

//add product route
router.get('/add-product', (req, res) =>{
    res.sendFile('add-product.html', {root : "public"});
})

router.get('/add-product/:id', (req, res) =>{
    res.sendFile('add-product.html', {root : "public"});
})

router.post('/add-product', (req, res ) =>{
    let {name, shortDes, detail, price, image, tags, email, draft, id} = req.body;

   if(!draft){
    if (!name.length){
        res.json({'alert' :'should enter product name '});
    } else if(!shortDes.length){
        res.json({'alert' :'description should be 80 letters long '});
    }else if(!price.length || !Number(price)){
        res.json({'alert' :'enter valid price '});
    }else if(!detail.length){
        res.json({'alert' :'you must enter detail'});
    }else if(!tags.length){
        res.json({'alert' :'enter tags'});
    }

   }
    //add product
    let docName = id == undefined ? `${name.toLowerCase()}-${Math.floor(Math.random()* 50000)}`: id;
  

    let products = collection(db, "products");
    setDoc(doc(products,docName), req.body)
    .then(data =>{
        res.json({'product': name})
    })
    .catch(err => {
        res.json({'alert' : 'some error occured.'})
    })
})

//get product route
router.post('/get-products', (req, res) =>{
    let {email, id, tag } = req.body;

    let products = collection (db, "products");
    let docRef;

    if (id){
        docRef = getDoc(doc(products, id));
    }
    else if (tag){
        docRef = getDocs(query(products, where("tags", "array-contains", tag)))
    }
    else{
        docRef = getDocs(query(products, where("email","==", email)))
    }

    

    docRef.then(products =>{
        if(products.empty){
            return res.json('no products');
        }
        let productArr = [];

        if(id){
            return res.json(products.data());
        }else{
            products.forEach(item =>{
                let data = item.data();
                data.id = item.id;
                productArr.push(data);
            })
        }

        res.json(productArr);
    })
})

router.post('/delete-product', (req, res) => {
    let {id} = req.body;

    deleteDoc(doc(collection(db, "products"), id))
    .then(data =>{
        res.json('success');
    }).catch(err => {
        res.json('err');
    })
})
//product route

router.get('/products/:id', (req, res) =>{
    res.sendFile("product.html",{ root : "public"})
})

//get search
router.get ('/search/:key', (req, res) =>{
    res.sendFile("search.html",{ root : "public"})
})

//add review
router.post('/add-review', (req, res) => {
    let { headline, review, rate, email, product } = req.body;
    // form validations
    if(!headline.length || !review.length || rate == 0 || email == null || !product){
        return res.json({'alert':'Fill all the inputs'});
    }
      // storing in Firestore
      let reviews = collection(db, "reviews");
      let docName = `review-${email}-${product}`;

      setDoc(doc(reviews, docName), req.body)
      .then(data => {
          return res.json('review')
      }).catch(err => {
          console.log(err)
          res.json({'alert': 'some err occured'})
      });
    
})

//get review
router.post('/get-reviews', (req, res) => {
    let { product, email } = req.body;

    let reviews = collection(db, "reviews");

    getDocs(query(reviews, where("product", "==", product)), limit(4))
    .then(review => {
        let reviewArr = [];

        if(review.empty){
            return res.json(reviewArr);
        }

        let userEmail = false;

        review.forEach((item, i) => {
            let reivewEmail = item.data().email;
            if(reivewEmail == email){
                userEmail = true;
            }
            reviewArr.push(item.data())
        })

        if(!userEmail){
            getDoc(doc(reviews, `review-${email}-${product}`))
            .then(data => reviewArr.push(data.data()))
        }

        return res.json(reviewArr);
    })
})

//cart route
router.get('/cart', (req, res) => {
    res.sendFile("cart.html", { root : "public" })
})
// checkout

router.get('/checkout', (req, res) => {
    res.sendFile("checkout.html", { root : "public" })
})

// stripe payment
let stripeGateway = stripe(process.env.stripe_key);

let DOMAIN = process.env.DOMAIN;

router.post('/stipe-checkout', async (req, res) => {
    const session = await stripeGateway.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        success_url: `${DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}&order=${encodeURI(JSON.stringify(req.body))}`,
        cancel_url: `${DOMAIN}/checkout?payment_fail=true`,
        line_items: req.body.items.map(item => {
            return {
               price_data: {
                   currency: "usd",
                   product_data: {
                       name: item.name,
                       description: item.shortDes,
                       images: [item.image]
                   },
                   unit_amount: item.price * 100
               },
               quantity: item.item 
            }
        })
    })

    res.json(session.url)
})

router.get('/success', async (req, res) => {
    let { order, session_id } = req.query;
    order = decodeURI(order);

    try{
        const session = await stripeGateway.checkout.sessions.retrieve(session_id);
        // const customer = await stripeGateway.customers.retrieve(session.customer);

        const customer = session.customer_details.email;

        let date = new Date();

        let orders_collection = collection(db, "orders");
        let docName = `${customer.email}-order-${date.getTime()}`;

        setDoc(doc(orders_collection, docName), JSON.parse(order))
        .then(data => {
            res.redirect('/checkout?payment=done')
        })

    } catch{
        res.redirect("/404");
    }
})

// 404route
router.get('/404', (req, res) =>{
    res.sendFile("404.html", {root : "public"})
})

api.use((req,res) =>{
    res.redirect('/404')
})

api.use("/", router);

export const handler = serverless(api);

