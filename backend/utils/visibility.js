/**
 * Determines if a viewer can see a user's content.
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
