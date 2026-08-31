/**
 * 🪷 INVITATION DETAIL - View invitation details, RSVP summary, and media
 */

import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamilyStore } from '../../state';
import { VanshColors } from '../../theme';
import type { CeremonyType, Nimantran, RSVPStatus } from '../../types';

interface InvitationDetailProps {
  invitation: Nimantran;
  onClose: () => void;
  onEdit?: () => void;
  onSend?: () => void;
  onDelete?: () => void;
}

const ceremonyLabels: Record<CeremonyType, string> = {
  wedding: 'Wedding',
  engagement: 'Engagement',
  housewarming: 'Housewarming',
  baby_shower: 'Baby Shower',
  birthday: 'Birthday',
  anniversary: 'Anniversary',
  puja: 'Puja',
  mundan: 'Mundan',
  thread_ceremony: 'Thread Ceremony',
  naming_ceremony: 'Naming Ceremony',
  graduation: 'Graduation',
  retirement: 'Retirement',
  reunion: 'Family Reunion',
  festival: 'Festival',
  other: 'Event',
};

const ceremonyIcons: Record<CeremonyType, keyof typeof MaterialIcons.glyphMap> = {
  wedding: 'favorite',
  engagement: 'diamond',
  housewarming: 'home',
  baby_shower: 'child-care',
  birthday: 'cake',
  anniversary: 'celebration',
  puja: 'self-improvement',
  mundan: 'content-cut',
  thread_ceremony: 'auto-awesome',
  naming_ceremony: 'badge',
  graduation: 'school',
  retirement: 'beach-access',
  reunion: 'groups',
  festival: 'festival',
  other: 'event',
};

const rsvpColors: Record<RSVPStatus, string> = {
  accepted: '#16A34A',
  declined: '#DC2626',
  maybe: '#F59E0B',
  pending: '#9CA3AF',
};

const rsvpLabels: Record<RSVPStatus, string> = {
  accepted: 'Accepted',
  declined: 'Declined',
  maybe: 'Maybe',
  pending: 'Pending',
};

function formatEventDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getDaysUntil(dateStr: string): string {
  const now = new Date();
  const event = new Date(dateStr);
  const diff = event.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return 'Today!';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export function InvitationDetail({ invitation, onClose, onEdit, onSend, onDelete }: InvitationDetailProps) {
  const insets = useSafeAreaInsets();
  const { getMember } = useFamilyStore();

  const rsvpSummary = useMemo(() => {
    const summary: Record<RSVPStatus, number> = {
      accepted: 0,
      declined: 0,
      maybe: 0,
      pending: 0,
    };
    invitation.recipients.forEach((r) => {
      summary[r.rsvpStatus] = (summary[r.rsvpStatus] || 0) + 1;
    });
    return summary;
  }, [invitation.recipients]);

  const handleShare = async () => {
    try {
      await Share.share({
        title: invitation.title,
        message: `You're invited! 🎉\n\n${invitation.title}\n📅 ${formatEventDate(invitation.eventDate)}${invitation.eventTime ? ` at ${invitation.eventTime}` : ''}\n📍 ${invitation.venue}${invitation.description ? `\n\n${invitation.description}` : ''}`,
      });
    } catch (err) {
      // ignore
    }
  };

  const icon = ceremonyIcons[invitation.ceremonyType] || 'event';
  const label = ceremonyLabels[invitation.ceremonyType] || 'Event';
  const daysText = getDaysUntil(invitation.eventDate);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onClose} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={22} color={VanshColors.masi[700]} />
        </Pressable>
        <Text style={styles.headerTitle}>Invitation</Text>
        <Pressable style={styles.shareButton} onPress={handleShare} hitSlop={12}>
          <MaterialIcons name="share" size={22} color={VanshColors.masi[700]} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Invitation Card/Video */}
        {invitation.cardUri ? (
          <Animated.View entering={FadeInUp.duration(300)}>
            <Image
              source={{ uri: invitation.cardUri }}
              style={styles.invitationImage}
              resizeMode="cover"
            />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.heroPlaceholder}>
            <MaterialIcons name={icon} size={56} color={VanshColors.suvarna[500]} />
          </Animated.View>
        )}

        {/* Video indicator */}
        {invitation.videoUri && (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.videoCard}>
            <MaterialIcons name="play-circle-filled" size={28} color={VanshColors.suvarna[600]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.videoCardTitle}>Invitation Video</Text>
              <Text style={styles.videoCardSubtitle}>Tap to watch</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={VanshColors.masi[400]} />
          </Animated.View>
        )}

        {/* Title & Ceremony Type */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.titleSection}>
          <View style={styles.ceremonyBadge}>
            <MaterialIcons name={icon} size={14} color={VanshColors.suvarna[600]} />
            <Text style={styles.ceremonyBadgeText}>{label}</Text>
          </View>
          <Text style={styles.title}>{invitation.title}</Text>
          <Text style={styles.countdown}>{daysText}</Text>
        </Animated.View>

        {/* Description */}
        {invitation.description && (
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.descriptionSection}>
            <Text style={styles.descriptionText}>{invitation.description}</Text>
          </Animated.View>
        )}

        {/* Event Info Cards */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.infoCards}>
          <View style={styles.infoCard}>
            <MaterialIcons name="event" size={22} color={VanshColors.suvarna[600]} />
            <View style={styles.infoCardContent}>
              <Text style={styles.infoCardLabel}>Date & Time</Text>
              <Text style={styles.infoCardValue}>{formatEventDate(invitation.eventDate)}</Text>
              {invitation.eventTime && (
                <Text style={styles.infoCardValue}>{invitation.eventTime}{invitation.eventEndTime ? ` - ${invitation.eventEndTime}` : ''}</Text>
              )}
            </View>
          </View>

          <View style={styles.infoCard}>
            <MaterialIcons name="place" size={22} color={VanshColors.suvarna[600]} />
            <View style={styles.infoCardContent}>
              <Text style={styles.infoCardLabel}>Venue</Text>
              <Text style={styles.infoCardValue}>{invitation.venue}</Text>
              {invitation.venueAddress && (
                <Text style={styles.infoCardAddress}>{invitation.venueAddress}</Text>
              )}
            </View>
          </View>

          {invitation.dressCode && (
            <View style={styles.infoCard}>
              <MaterialIcons name="checkroom" size={22} color={VanshColors.suvarna[600]} />
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardLabel}>Dress Code</Text>
                <Text style={styles.infoCardValue}>{invitation.dressCode}</Text>
              </View>
            </View>
          )}

          {invitation.contactPhone && (
            <View style={styles.infoCard}>
              <MaterialIcons name="phone" size={22} color={VanshColors.suvarna[600]} />
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardLabel}>Contact</Text>
                <Text style={styles.infoCardValue}>{invitation.contactPhone}</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Special Instructions */}
        {invitation.specialInstructions && (
          <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.specialCard}>
            <MaterialIcons name="info-outline" size={20} color={VanshColors.suvarna[600]} />
            <Text style={styles.specialText}>{invitation.specialInstructions}</Text>
          </Animated.View>
        )}

        {/* RSVP Summary */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={styles.sectionTitle}>RSVP Summary</Text>
          <View style={styles.rsvpSummary}>
            {(Object.keys(rsvpSummary) as RSVPStatus[]).map((status) => (
              <View key={status} style={styles.rsvpItem}>
                <View style={[styles.rsvpDot, { backgroundColor: rsvpColors[status] }]} />
                <Text style={styles.rsvpLabel}>{rsvpLabels[status]}</Text>
                <Text style={styles.rsvpCount}>{rsvpSummary[status]}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Recipients List */}
        <Animated.View entering={FadeInDown.delay(350).springify()}>
          <Text style={styles.sectionTitle}>
            Guests ({invitation.recipients.length})
          </Text>
          <View style={styles.guestList}>
            {invitation.recipients.map((recipient) => {
              const member = getMember(recipient.memberId);
              const name = member
                ? `${member.firstName} ${member.lastName}`
                : 'Family Member';
              return (
                <View key={recipient.memberId} style={styles.guestItem}>
                  <View style={styles.guestAvatar}>
                    <Text style={styles.guestAvatarText}>
                      {name[0] || '?'}
                    </Text>
                  </View>
                  <Text style={styles.guestName} numberOfLines={1}>
                    {name}
                  </Text>
                  <View style={[styles.rsvpStatusBadge, { backgroundColor: rsvpColors[recipient.rsvpStatus] + '20' }]}>
                    <Text style={[styles.rsvpStatusText, { color: rsvpColors[recipient.rsvpStatus] }]}>
                      {rsvpLabels[recipient.rsvpStatus]}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Reminders */}
        {invitation.reminders.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <Text style={styles.sectionTitle}>Reminders</Text>
            <View style={styles.remindersList}>
              {invitation.reminders.map((rem) => (
                <View key={rem.id} style={styles.reminderItem}>
                  <MaterialIcons
                    name={rem.sent ? 'notifications-active' : 'notifications-none'}
                    size={18}
                    color={rem.sent ? '#16A34A' : VanshColors.masi[400]}
                  />
                  <Text style={styles.reminderText}>
                    {rem.daysBefore} day{rem.daysBefore !== 1 ? 's' : ''} before
                  </Text>
                  {rem.sent && (
                    <Text style={styles.reminderSent}>Sent</Text>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Status */}
        <Animated.View entering={FadeInDown.delay(450).springify()} style={styles.statusSection}>
          <View style={[
            styles.statusBadge,
            invitation.status === 'sent' && styles.statusSent,
            invitation.status === 'draft' && styles.statusDraft,
            invitation.status === 'cancelled' && styles.statusCancelled,
          ]}>
            <MaterialIcons
              name={invitation.status === 'sent' ? 'check-circle' : invitation.status === 'draft' ? 'edit' : 'cancel'}
              size={16}
              color={invitation.status === 'sent' ? '#16A34A' : invitation.status === 'draft' ? '#D97706' : '#DC2626'}
            />
            <Text style={[
              styles.statusText,
              { color: invitation.status === 'sent' ? '#16A34A' : invitation.status === 'draft' ? '#D97706' : '#DC2626' }
            ]}>
              {invitation.status === 'sent' ? 'Invitation Sent' : invitation.status === 'draft' ? 'Draft' : 'Cancelled'}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {(onEdit || onSend || onDelete) && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {onDelete && (
            <Pressable style={styles.deleteButton} onPress={onDelete}>
              <MaterialIcons name="delete-outline" size={20} color="#DC2626" />
            </Pressable>
          )}
          <View style={{ flex: 1 }} />
          {onEdit && invitation.status === 'draft' && (
            <Pressable style={styles.editButton} onPress={onEdit}>
              <MaterialIcons name="edit" size={18} color={VanshColors.masi[600]} />
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          )}
          {onSend && invitation.status === 'draft' && (
            <Pressable style={styles.sendButton} onPress={onSend}>
              <MaterialIcons name="send" size={18} color="#FFF" />
              <Text style={styles.sendButtonText}>Send</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: VanshColors.khadi[200],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VanshColors.khadi[100],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: VanshColors.masi[800],
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
  },
  invitationImage: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    marginTop: 16,
  },
  heroPlaceholder: {
    width: '100%',
    height: 160,
    borderRadius: 20,
    marginTop: 16,
    backgroundColor: VanshColors.suvarna[50] || '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  videoCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: VanshColors.masi[800],
  },
  videoCardSubtitle: {
    fontSize: 12,
    color: VanshColors.masi[400],
  },
  titleSection: {
    marginTop: 20,
  },
  ceremonyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: VanshColors.suvarna[50] || '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  ceremonyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: VanshColors.suvarna[600],
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: VanshColors.masi[800],
    letterSpacing: -0.3,
  },
  countdown: {
    fontSize: 14,
    fontWeight: '600',
    color: VanshColors.suvarna[600],
    marginTop: 6,
  },
  descriptionSection: {
    marginTop: 16,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: VanshColors.masi[600],
  },
  infoCards: {
    marginTop: 20,
    gap: 10,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: VanshColors.masi[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 15,
    fontWeight: '600',
    color: VanshColors.masi[800],
  },
  infoCardAddress: {
    fontSize: 13,
    color: VanshColors.masi[500],
    marginTop: 2,
  },
  specialCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: VanshColors.suvarna[50] || '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  specialText: {
    flex: 1,
    fontSize: 14,
    color: VanshColors.masi[600],
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: VanshColors.masi[800],
    marginTop: 24,
    marginBottom: 12,
  },
  rsvpSummary: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rsvpItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  rsvpDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rsvpLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: VanshColors.masi[500],
  },
  rsvpCount: {
    fontSize: 20,
    fontWeight: '800',
    color: VanshColors.masi[800],
  },
  guestList: {
    gap: 6,
  },
  guestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
  },
  guestAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: VanshColors.suvarna[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: VanshColors.suvarna[700],
  },
  guestName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: VanshColors.masi[800],
  },
  rsvpStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  rsvpStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  remindersList: {
    gap: 6,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
  },
  reminderText: {
    flex: 1,
    fontSize: 14,
    color: VanshColors.masi[600],
  },
  reminderSent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  statusSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusSent: {
    backgroundColor: '#DCFCE7',
  },
  statusDraft: {
    backgroundColor: '#FEF3C7',
  },
  statusCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: VanshColors.khadi[200],
    backgroundColor: '#FAFAF9',
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: VanshColors.khadi[300],
    marginRight: 10,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: VanshColors.masi[600],
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
