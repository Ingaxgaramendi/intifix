"""
Custom JWT authentication that doesn't require a local user database.

The Spring backend (intifix-2026) issues JWTs with the user ID in the standard 'sub'
claim, not 'user_id'. Since this admin panel doesn't have local users (all users
exist in the Spring backend), we need to authenticate by building a lightweight
user object directly from the JWT claims without hitting the database.
"""
from __future__ import annotations

from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError


class ClaimsBasedJWTAuthentication(JWTAuthentication):
    """
    JWT authentication that builds a user from claims without DB lookup.
    
    This class overrides the default simple-jwt behavior of loading a user from
    the database. Instead, it creates a lightweight user object directly from the
    JWT claims, which is suitable when:
    - The auth service is the source of truth for users
    - No local user database exists
    - The JWT contains all necessary claims (sub, roles, etc.)
    """

    def get_user(self, validated_token: dict) -> AnonymousUser:
        """
        Build a lightweight user from JWT claims without DB lookup.
        
        Args:
            validated_token: The decoded and validated JWT payload
            
        Returns:
            A lightweight AnonymousUser-like object with id and roles attributes
        """
        # Extract user ID from 'sub' claim (standard JWT claim)
        user_id = validated_token.get("sub")
        
        # Extract roles for RBAC
        roles = validated_token.get("roles", []) or []
        if not isinstance(roles, (list, tuple)):
            roles = [roles]
        
        # Create a lightweight user object
        # We use AnonymousUser as a base but add our custom attributes
        user = AnonymousUser()
        user.id = user_id
        user.roles = roles
        user.is_authenticated = True
        
        return user
