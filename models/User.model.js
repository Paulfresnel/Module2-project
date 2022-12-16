const { Schema, model } = require("mongoose");


const userSchema = new Schema(
  {
    username: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },

    predictions: [{ type: Schema.Types.ObjectId, ref: "Prediction"}],
    predictionsCount : {
      type: Number,
      default: 0
    },
    correctPredictions : {
      type: Number,
      default: 0
    },
    wrongPredictions : {
      type: Number,
      default: 0
    },
    predictionsPoints: {
      type: Number,
      default: 0
    },
    players: [{ type: Schema.Types.ObjectId, ref: "Player"}],
    predictionMessage:{
      type: String
    },
    fantasyPoints: {
      type: Number,
      default: 0
    },
    predictionsRate:{
      type: String,
      default: 0
    }
  },
  {

  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`

    timestamps: true,
  }
);

const User = model("User", userSchema);

module.exports = User;
