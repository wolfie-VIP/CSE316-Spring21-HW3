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