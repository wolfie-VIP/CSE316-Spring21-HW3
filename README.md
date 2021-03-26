# CSE316-Spring21-HW3
##### Authors: Justin Fagan and Charlie Monnone
### Getting Started
##### Configuring .env
NOTE: In a full production application, an environment file would not be stored in a git repository. This file contains information vital to the security of the application, and should not be publicly available. For the sake of ease/learning, this .env is included in the repository, but do not do this in general.

The backend utilizes a .env file to store a few constants which are necessary for the application to function. Some of that information is already there, such as the port numbers for the front and backend servers, as well as the client URL. The refresh and access token secrets are random character sequences used to sign and verify JWTs used by the authentication system. These are essentially passwords that the JWT middleware uses to hash login info, to both save new users and to verify returning ones. Use a site like https://passwordsgenerator.net/, or just come up with a random string yourself for these values. There isn't a hard length requirement on the secret, but smaller keys are more easy to guess by malicious actors, so 32 characters(256 bits) are recommended.

The Mongo URI requires a bit more setup. 
1. First create a MongoDB account: https://account.mongodb.com/account/login. 
2. Once you are logged in, click "Create an Organization". Name it whatever you like, make sure MongoDB Atlas is selected, and create the organization(don't worry about adding members). 
3. Create a new project.
4. Create a new cluster(choose the free tier). The default provider/region settings should be fine, so click "create cluster", and wait for it to be created( it may take a few minutes).
5. Once your cluster is finished configuring, click on "Connect". Add your IP and set up a database user.
6. Click "choose a connection method", and then select the middle option, "Connect your application".
7. Choose Node.js and version 3.6 or later, if they are not already selected. Eeplace \<password>(including the angle brackets) with your password for the database user, replace```myFirstDatabase``` with the database name(which we called TodoTracker) and paste the string into your .env file. It should look something like this:`MONGO_URI = "mongodb+srv....`
8. On the MongoDB Atlas page, click "Collections", and then "Create Database". Enter both fields exactly as follows: ```Database Name: TodoTracker``` ```Collection Name: users```. Then click "Create".
9. Click the "plus" button next to the name of your database(which should be TodoTracker), and create another collection like : ```Collection Name: todolists``` 
10. On the left sidebar, click "Network Access" under security. Click "Add IP Address", and select your own. This last step shouldn't be necessary, but if you experience fetch/network issues during setup, adding your IP and 0.0.0.0 (allow from anywhere) are worth trying.   

##### Installing Modules
Before working with TodoTracker, make sure Node.js is installed on your machine (https://nodejs.org/en/). Either clone or download this git repository. In the TodoTracker folder complete the following steps:
* In the root directory run ```npm install```
* Go to the client directory(./client) using ```cd client``` and run ```npm install``` again.
* Return to the root directory using ```cd ..```

You now have everything you need to start the application, and there are two options for starting the application:

* Run ```npm start``` in the root directory
* Run ```nodemon``` in the root directory and in a separate terminal, run ```npm start``` in the client directory

Generally option 1 is the preferred method as it is more convenient than manually running two separate scripts, but depending on what you’re working on, having both the front and back end servers running separately may help to verify information/better catch a bug.

### Backend
##### Index and Server-Config
Index.js is the main entry point for the backend; it handles the creation of the server(s), applies middleware to the server, and defines the database connection. Server-Config is an optional file meant to help organize the middleware used by the server.

In this example application, enough middleware code exists to the point where index.js would become difficult to parse, so for the sake of retaining a simplified overview of the server, much of the middleware setup is handled in server-config.js, including the validation of refresh and access tokens.

The backend used by TodoTracker is actually two servers: Apollo Server, which is a GraphQL server, and an ExpressJS server. We do this so that we can combine the mature ecosystem of middleware written for Express with the simplicity of a GraphQL server. Much of the middleware we use is applied to the Express server, and we use Apollo\'s official Express integration to treat the Express server as middleware for the Apollo Server. GraphQL queries and mutations define the types of requests we can make to the Apollo Server, and resolvers(which are ordinary javascript functions) define how to satisfy those requests.

##### Tokens 
The application platform utilizes a JSON Web Token(JWT) based system for authentication. Tokens.js handles the generation of access and refresh tokens, which are stored cookies that the server is able to parse. Upon each request to the server, a middleware function(defined in server-config.js) looks for both the access and refresh tokens. Depending on the server request, invalid or missing tokens imply specific situations: 
* A valid access token means the user is logged in.
* An invalid/missing access token with a valid refresh token means the user has logged in to the service in the past 7 days.

Invalid/missing access and refresh tokens could also mean the user has never logged in; depending on the circumstance, the server middleware will either generate missing tokens or refuse the request.

##### Models
The model files define the schema used for the database. TodoTracker uses MongoDB along with Mongoose as an Object Document Mapper(ODM).

##### TypeDefs
The typedef files are where all GraphQL types, queries, and mutations used by the backend are defined. Queries and mutations describe requests and operations for a data source, which, in our case, is a MongoDB database. Queries and mutations also require matching functions that fulfill requests. You can think of GraphQL as an abstract description of a request: get me a todolist, update this todolist, etc., which is then implemented by a function. Using GraphQL as an abstraction layer, we  could swap out the implementation of any given request without having to touch any other part of our service. Apollo refers to these functions as resolvers. 

##### Resolvers
The resolvers files are where substantive changes to data occurs. Resolver functions are passed arguments specified by queries and mutations, and interact with the database to create, retrieve, update, and delete data.

### General Flow of Backend Requests
A line like this often appears in the client code:

`const { loading, error, data } = useQuery(...);`

When a query/mutation is made, different states are returned depending on the execution phase. Loading and error are fairly straightforward, and data contains a return object bearing the name of a query or mutation. As an example, a query called `getUser` would return some data and be accessed via `data.getUser`.

In the average case, a query or mutation will originate from the frontend and be passed to the backend server url(or uri, as it is defined by Apollo Client). Every request sends along cookies which may or may not contain access or refresh tokens. The request is validated and passed through any remaining middleware functions. 

The Apollo server will receive the query/mutation as part of the request, verify that it perfectly matches its corresponding typedef, and then will search the resolver map for a resolver matching the name of the query/mutation. Once the resolver is found, it\'s executed and any return type defined by the query/mutation is sent back to the originating request in the data object.

### Frontend
##### Index and App
Index.js serves as the entry/start point for the frontend and defines the root node for React. Index primarily configures the Apollo Client and sets it as a Provider for the React tree of nodes. Providers and Contexts are part of the React API; a brief explanation of a Context is that exposes data and functions defined in the Provider to all child nodes of the React component that receives the Provider as a prop. Since the Apollo Client is a Provider that is passed to the root component App.js, every component in the React application has access to the Apollo Client. 

Most of the client configuration is straightforward; we set a uri, `uri: SERVER_LOCAL_DOMAIN`, which points to our backend server. We tell the client to include authentication related cookies with `credentials: 'include'`. We also initialize the cache, which is defined beforehand. Apollo Client serializes queries and mutations in the form of TYPNAME:ID, where TYPENAME is taken from the `__typename` field defined in a GraphQL type, and ID is taken from an object\' `_id` field, which is of an ObjectID type. This step is done on the line:

`` dataIdFromObject: object => `${object.__typename}:${object._id}` ``.

##### Cache
The Cache folder holds the frontend\'s GraphQL related code. These queries and mutations essentially act as wrappers around those defined for the backend; they exist to allow the frontend to pass arguments to some of the queries and mutations defined in the typedefs folder.

##### Components
The Components folder holds React components. A full explanation of the React library is beyond the scope of the document, and would be a poorer explanation than that provided by the official documentation.

##### Utils
The utils folder is a bit subjective; it is intended to hold javascript code that does not explicitly deal with React or Apollo Client. For TodoTracker, the undo/redo system is defined in utils. 
#
#### CSS
All CSS files should go in this folder. To editorialize a bit: separating css layout and style attributes into separate css files makes tweaking either easy without unintentionally breaking something, at the cost of potentially defining a selector in two places.



# More on the Backend

### Models and Typedefs
Think of models as a blueprint for the data you want to be saved within your database while typedefs in GraphQL are the blueprint for your entire API. It's similar to using type checking for in a compiled languages in a sense that it helps you catch your mistakes earlier on. However with GraphQL you have to explicitly state resolver definitions, parameter types and 

### Separation of Concerns
In the models directory you should be setting up the database using mongoose as the ORM of choice and splitting the code up by data object. For example, in the models directory you should create a model for a User object as User.js and a resource model in a separate file e.g. Wireframe.js, Todolist.js, etc. It is not a good practice to keep resources as the user and instead you should have a reference to the User's id instead within the resource.

```javascript
const { model, Schema, ObjectId } = require('mongoose');
const Item = require('./item-model').schema;

const todolistSchema = new Schema(
	{
		_id: {
			type: ObjectId,
			required: true
		},
		id: {
			type: Number,
			required: true
		},
		name: {
			type: String,
			required: true
		},
		owner: {
			type: String,
			required: true
		},
		items: [Item],
	},
	{ timestamps: true }
);

const Todolist = model('Todolist', todolistSchema);
module.exports = Todolist;
```
An important thing to note is that when you are designing the GraphQL typedefs you must keep your models and typedefs in sync otherwise you'll eventually run into an error. Similar to creating database models, you should separate your typedefs based on the database models and the associated functions/resolvers you would use with them.
```javascript
// ./typedefs/todolists-def.js

const { gql } = require('apollo-server');

const typeDefs = gql `
	type Todolist {
		_id: String!
		id: Int!
		name: String!
		owner: String!
		items: [Item]
	}
	type Item {
		_id: String!
		id: Int!
		description: String!
		due_date: String!
		assigned_to: String!
		completed:  Boolean!
	}
	extend type Query {
		getAllTodos: [Todolist]
		getTodoById(_id: String!): Todolist 
	}
	extend type Mutation {
		addItem(item: ItemInput!, _id: String!): String
		addTodolist(todolist: TodoInput!): String
		deleteItem(itemId: String!, _id: String!): [Item]		
		deleteTodolist(_id: String!): Boolean
		updateTodolistField(_id: String!, field: String!, value: String!): String
		updateItemField(itemId: String!, _id: String!, field: String!, value: String!, flag: Int!): [Item]
		reorderItems(itemId: String!, _id: String!, direction: Int!): [Item]
	}
	input FieldInput {
		_id: String
		field: String
		value: String
	}
	input TodoInput {
		_id: String
		id: Int
		name: String
		owner: String
		items: [ItemInput]
	}
	input ItemInput {
		_id: String
		id: Int
		description: String
		due_date: String
		assigned_to: String
		completed:  Boolean
	}
`;

module.exports = { typeDefs: typeDefs }

```

```bash
|--models
|   |-- User.js
|   |-- Todolist.js
|--typedefs
|   |-- userTypedefs.js
|   |-- todolistTypedefs.js
|   |-- rootTypedefs.js #Merge the files here
|--resolvers
|   |-- userResolvers.js
|   |-- todolistResolvers.js
|   |-- rootResolvers.js #Merge the files here
```

### Resolvers are Controllers
Resolvers are essentially controllers (the C in MVC) which will interact with the database and either query or mutate the database based on the type of resolver being used. The anatomy of a resolver is as such:
```javascript
module.exports = {
  Query:{
    hello: (_, args, context) => {
      const { name } = args
      return `Hello ${name}!`
    }
  },
  Mutation: {
  
  }
}
```

In an unmentioned typedef we defined a hello resolver that take in an argument called name but we could've destructured it in the header like so

```javascript
Query:{
  hello: (_, { name }, context) => {
    return `Hello ${name}!`
  }
}
```
[Context](https://www.apollographql.com/docs/apollo-server/data/resolvers/#the-context-argument) is an object "An object (or a function that creates an object) that's passed to every resolver that executes for a particular operation. This enables resolvers to share helpful context, such as a database connection." (Straight from the apollo documentation) A common practice is to pass in the the Express Request and Response objects to the context so that every resolver has extended HTTP request and response functionality if needed.
```javascript
// index.js
const server = new ApolloServer({
  typeDefs: typeDefs,
	resolvers: resolvers,
	context: ({req, res}) => ({ req, res })
});

//some resolver path
Query:{
  hello: (_, { name }, { req, res }) => {
    const { headers } = req
    res.status(200) //An OK response
    return `Hello ${name}!`
  }
}
```

## Relevant Links


https://mongoosejs.com/docs/guide.html

https://reactjs.org/docs/getting-started.html

https://www.apollographql.com/docs/react/

https://www.apollographql.com/docs/apollo-server/

https://jwt.io/introduction/

https://graphql.org/learn/

http://expressjs.com/
