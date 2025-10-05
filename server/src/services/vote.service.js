import Vote from "../models/Vote.js";
import Post from "../models/Post.js";
import Answer from "../models/Answer.js";

async function applyTally(targetType, targetId) {
  // recompute tally from votes (simple and safe for your scale)
  const res = await Vote.aggregate([
    { $match: { targetType, targetId } },
    { $group: { _id: null, sum: { $sum: "$value" } } },
  ]);

  const votes = res?.[0]?.sum || 0;
  if (targetType === "post") {
    await Post.updateOne({ _id: targetId }, { $set: { votes } });
  } else if (targetType === "answer") {
    await Answer.updateOne({ _id: targetId }, { $set: { votes } });
  }
}

export async function cast({ targetType, targetId, userId, value }) {
  // value in [-1, 0, 1]; 0 = unvote
  await Vote.updateOne(
    { targetType, targetId, userId },
    { $set: { value } },
    { upsert: true }
  );
  await applyTally(targetType, targetId);
  return { ok: true };
}

export async function getUserVote({ targetType, targetId, userId }) {
  const v = await Vote.findOne({ targetType, targetId, userId }).lean();
  return { value: v?.value ?? 0 };
}
