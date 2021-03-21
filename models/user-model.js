const { model, Schema, ObjectId } = require('mongoose');

const userSchema = new Schema(
	{
		_id: {
			type: ObjectId,
			required: true
		},
		firstName: {
			type: String,
			required: true
		},
		lastName: {
			type: String,
			required: true
		},
		initials: {
			type: String,
			required: true
		},
		email: {
			type: String,
			required: true
		},
		password: {
			type: String,
			required: true
		}
	},
	{ timestamps: true }
);

const User = model('User', userSchema);
module.exports = User;