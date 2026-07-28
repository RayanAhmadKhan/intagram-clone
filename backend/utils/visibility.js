/**
 * A viewer can see a user's content if: it's their own content, the account
 * is public, or the viewer is an approved follower. Used by Posts (Step 8)
 * and will be reused by Feed (Step 13) so the privacy rule stays consistent
 * in exactly one place.
 * @param {import('mongoose').Types.ObjectId} viewerId
 * @param {import('../models/User')} ownerUser - a fetched User document (needs isPrivate + followers)
 * @returns {boolean}
 */
const canViewUserContent = (viewerId, ownerUser) => {
  if (ownerUser._id.equals(viewerId)) return true;
  if (!ownerUser.isPrivate) return true;
  return ownerUser.followers.some((f) => f.equals(viewerId));
};

module.exports = { canViewUserContent };
