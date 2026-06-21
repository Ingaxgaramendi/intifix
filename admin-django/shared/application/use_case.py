"""
Use Case base class (application layer).

A use case is a single, named business operation. It depends only on
abstractions (repository/gateway interfaces) injected through its constructor
(Dependency Inversion + Single Responsibility). Interfaces (DRF views) build
the use case with concrete gateways and call ``execute``.
"""
from __future__ import annotations

import abc
from typing import Generic, TypeVar

TInput = TypeVar("TInput")
TOutput = TypeVar("TOutput")


class UseCase(abc.ABC, Generic[TInput, TOutput]):
    @abc.abstractmethod
    def execute(self, request: TInput) -> TOutput:
        """Run the business operation and return its result."""
        raise NotImplementedError
