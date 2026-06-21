/**
 * Thin typed wrappers over Firestore `onSnapshot`. They give the ergonomics of a
 * data-fetching library — `{ data, loading, error }` — while keeping Firestore's
 * native real-time + offline behaviour. We subscribe with
 * `includeMetadataChanges` so callers can read `hasPendingWrites` (a write that
 * hasn't reached the server yet) to render optimistic "sending…" states.
 *
 * Queries/refs are compared with Firestore's structural equality, so callers get
 * a stable subscription without having to perfectly memoize the reference.
 */
import { useEffect, useRef, useState } from 'react';
import {
  onSnapshot,
  queryEqual,
  refEqual,
  type DocumentReference,
  type Query,
} from 'firebase/firestore';

export interface CollectionState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  fromCache: boolean;
  hasPendingWrites: boolean;
}

export interface DocState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  fromCache: boolean;
  hasPendingWrites: boolean;
}

export function useCollection<T>(query: Query<T> | null): CollectionState<T> {
  const stableQuery = useStableQuery(query);
  const [state, setState] = useState<CollectionState<T>>({
    data: [],
    loading: true,
    error: null,
    fromCache: false,
    hasPendingWrites: false,
  });

  useEffect(() => {
    if (!stableQuery) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = onSnapshot(
      stableQuery,
      { includeMetadataChanges: true },
      (snap) =>
        setState({
          data: snap.docs.map((d) => d.data()),
          loading: false,
          error: null,
          fromCache: snap.metadata.fromCache,
          hasPendingWrites: snap.metadata.hasPendingWrites,
        }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
    return unsub;
  }, [stableQuery]);

  return state;
}

export function useDoc<T>(ref: DocumentReference<T> | null): DocState<T> {
  const stableRef = useStableRef(ref);
  const [state, setState] = useState<DocState<T>>({
    data: null,
    loading: true,
    error: null,
    fromCache: false,
    hasPendingWrites: false,
  });

  useEffect(() => {
    if (!stableRef) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = onSnapshot(
      stableRef,
      { includeMetadataChanges: true },
      (snap) =>
        setState({
          data: snap.exists() ? snap.data() : null,
          loading: false,
          error: null,
          fromCache: snap.metadata.fromCache,
          hasPendingWrites: snap.metadata.hasPendingWrites,
        }),
      (error) => setState((s) => ({ ...s, loading: false, error })),
    );
    return unsub;
  }, [stableRef]);

  return state;
}

function useStableQuery<T>(query: Query<T> | null): Query<T> | null {
  const ref = useRef<Query<T> | null>(query);
  if (query && ref.current && queryEqual(query, ref.current)) return ref.current;
  ref.current = query;
  return query;
}

function useStableRef<T>(docRef: DocumentReference<T> | null): DocumentReference<T> | null {
  const ref = useRef<DocumentReference<T> | null>(docRef);
  if (docRef && ref.current && refEqual(docRef, ref.current)) return ref.current;
  ref.current = docRef;
  return docRef;
}
