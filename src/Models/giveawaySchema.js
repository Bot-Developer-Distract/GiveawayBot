const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gawSchema = new Schema({
    msgid: {type: String, required: true, unique: true},
    serverID: {type: String},
    status: {type: Boolean, default: true},
    chId: {type: String},
    host: {type: String, default: null},
    prize: {type: String, default: null},
    winCount: {type: Number, default: 1},
    winners: {type: Array, default: []},
    endtime: {type: String, default: null},
    req: {type: Map, default: {}},
    multi: {type: Map, default: {}},
    entries: {type: Array, default: []},
    entrylimit: {type: String, default: 'infinite'}
});
const gawModel = mongoose.model("Giveaway", gawSchema);

module.exports = gawModel;