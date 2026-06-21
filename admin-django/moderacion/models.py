# Intentionally empty.
#
# The Moderation context owns NO business entities. Reports live in the Services
# Service and user state lives in the Users Service — both consumed over REST via
# gateways (Anti-Corruption Layer). The panel-exclusive moderation artifacts
# (internal comments, moderation history) are append-only operational documents
# stored in the panel's own MongoDB, following the same pattern as the audit
# trail. Therefore there are no Django ORM models and no business migrations.
