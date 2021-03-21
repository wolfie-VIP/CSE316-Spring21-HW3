const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const resolvers = require('./resolvers/root-resolver');
const { typeDefs }  = require('./typedefs/root-def');
const serverOptions = require('./server-config');
require('dotenv').config();
const { MONGO_URI, BACKEND_PORT, CLIENT_LOCAL_ORIGIN, SERVER_LOCAL_DOMAIN } = process.env;

// create express server handling our middleware 
const app = express();

// since we presume cors is enabled, this next step is not optional, so cors
// is enable here instead of in options
app.use(cors({ origin: CLIENT_LOCAL_ORIGIN, credentials: true }));

const corsPolicy = async(req, res, next) => {
    /*
        TODO for 316 students: res.set(), Access-Control-Allow-Origin and Access-Control-Allow-Credentials headers,
        have them set these, inspect error messages, understand why they're needed
    */
	res.set("Access-Control-Allow-Origin", req.headers.origin.toString());
    res.set("Access-Control-Allow-Credentials", true);
	next();
}

app.options('*', cors());
app.use(corsPolicy);


// middleware application is configured to happen in server-config.js
serverOptions(app);

const server = new ApolloServer({
    typeDefs: typeDefs,
	resolvers: resolvers,
	context: ({req, res}) => ({ req, res })
});

// since the express server has cors configured, cors on the apollo server
// can be false; passing the same options as defined on the express instance
// works as well
server.applyMiddleware({ app , cors: false});

mongoose.connect(MONGO_URI, {useNewUrlParser: true , useUnifiedTopology: true})
        .then(() => {
            app.listen({ port: BACKEND_PORT }, CLIENT_LOCAL_ORIGIN, () => {
                console.log(`Server ready at ${SERVER_LOCAL_DOMAIN}:${BACKEND_PORT}`);
            })
        })
        .catch(error => {
            console.log(error)
        });