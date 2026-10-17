// Seat rule (one rule, used everywhere): a seat is taken by every active member AND by every pending invitation that has
// not expired or been revoked. Pending invitations reserve a seat so an organisation can never over-invite. Expiry,
// revocation and removal release the seat. The same rule is enforced atomically in Postgres (billing_create_invitation).
export interface SeatCounts { seats: number; members: number; pendingInvitations: number }

export function seatUsage(c: SeatCounts) {
  const used = c.members + c.pendingInvitations
  return { used, available: Math.max(0, c.seats - used), seats: c.seats, label: `${used} of ${c.seats} seats used` }
}

export const canReserveSeats = (c: SeatCounts, wanted = 1) => wanted >= 1 && c.members + c.pendingInvitations + wanted <= c.seats
