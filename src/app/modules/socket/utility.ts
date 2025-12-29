export async function removeInviteForUser(
  redisClient: any,
  userId: string,
  gameId: string,
  roomId: string
) {
  const inviteKey = `user:${userId}:invites`;

  const invitesRaw = await redisClient.lrange(inviteKey, 0, -1);
  if (invitesRaw.length === 0) return;

  const remaining = invitesRaw.filter((raw: string) => {
    const invite = JSON.parse(raw);
    return !(invite.gameId === gameId && invite.roomId === roomId);
  });

  await redisClient.del(inviteKey);

  if (remaining.length > 0) {
    await redisClient.rpush(inviteKey, ...remaining);
  }
}
