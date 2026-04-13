const GROUP_RANK_PREFIX = "group-rank:";

export function decodeRefLabel(
  refLabel: string,
  groupMap: Record<string, string> | Map<string, string>,
): string {
  if (!refLabel.startsWith(GROUP_RANK_PREFIX)) return refLabel;
  const rest = refLabel.slice(GROUP_RANK_PREFIX.length);
  const lastColon = rest.lastIndexOf(":");
  if (lastColon === -1) return refLabel;
  const groupId = rest.slice(0, lastColon);
  const rank = Number(rest.slice(lastColon + 1));
  if (!groupId || isNaN(rank)) return refLabel;
  const groupName =
    groupMap instanceof Map ? (groupMap.get(groupId) ?? groupId) : (groupMap[groupId] ?? groupId);
  return `${groupName} ${rank}位`;
}
