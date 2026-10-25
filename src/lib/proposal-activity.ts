export type ProposalActivity = {
  id: number;
  user: number;
  action: "Apoyar" | "Discrepar";
  timestamp: string | null;
  supportDelta: number;
};

export function publicAuthor(user: number) {
  if (!Number.isSafeInteger(user) || user < 1) throw new Error("Invalid public user number");
  return `Usuario #${user}`;
}

export function supportSeries(events: ProposalActivity[]) {
  let cumulative = events.filter((e) => !e.timestamp).reduce((sum, e) => sum + Math.max(0, e.supportDelta), 0);
  return events.filter((e) => e.timestamp).sort((a, b) =>
    Date.parse(a.timestamp ?? "") - Date.parse(b.timestamp ?? "") || a.id - b.id,
  ).map((event) => {
    cumulative += Math.max(0, event.supportDelta);
    return { ...event, time: Date.parse(event.timestamp ?? ""), cumulative };
  });
}

export function activityDate(timestamp: string) {
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium", timeStyle: "long", timeZone: "America/Caracas",
  }).format(new Date(timestamp));
}