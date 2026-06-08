;; sam-policy.clar
;; SAM Policy -- Stacks Clarity port of SAMPolicy.sol
;; ERC-8004-inspired programmable agent permissions
;; Chain: Stacks Mainnet
;;
;; Scope IDs (uint) mirror Solidity keccak256 semantics -- human-readable labels
;; are documented in the simulation and frontend; the contract uses uint for type safety.
;;   u1 = sam.cancel   u2 = sam.pause   u3 = sam.remind   u4 = sam.analyze
;;
;; Improvements over SAMPolicy.sol:
;;   - expiry = u0 = permanent (no uint256.max sentinel trick needed)
;;   - authorize rejects already-expired block heights (fixes silent bug in Solidity)
;;   - revoke uses map-delete (no residual zero-sentinel)
;;   - revoke-all emits one event covering all 4 scopes (fixes Solidity event gap)
;;   - get-permission and get-all-default-scopes read-only getters added
;;   - transfer-ownership added (missing from Solidity)

;; -- Error codes --------------------------------------------------------------

(define-constant ERR-NOT-OWNER          (err u401))
(define-constant ERR-EXPIRED-ON-ARRIVAL (err u402))

;; -- Scope ID constants -------------------------------------------------------

(define-constant SCOPE-CANCEL  u1)
(define-constant SCOPE-PAUSE   u2)
(define-constant SCOPE-REMIND  u3)
(define-constant SCOPE-ANALYZE u4)

;; -- State --------------------------------------------------------------------

(define-data-var contract-owner principal tx-sender)
(define-data-var sam-agent      principal tx-sender)

;; user -> agent -> scope-id -> expiry block-height
;;   u0            = permanent (no expiry)
;;   any other uint = block-height at which permission expires (exclusive)
;; absent (map-get? = none) = not granted
(define-map permissions
  { user: principal, agent: principal, scope: uint }
  uint
)

;; -- Read-only ----------------------------------------------------------------

(define-read-only (is-authorized (user principal) (agent principal) (scope uint))
  (match (map-get? permissions { user: user, agent: agent, scope: scope })
    expiry (if (is-eq expiry u0)
              true
              (< block-height expiry))
    false
  )
)

;; Returns raw stored expiry: (some uint) = granted, none = not granted.
;; u0 means permanent; any other value is the expiry block-height.
(define-read-only (get-permission (user principal) (agent principal) (scope uint))
  (map-get? permissions { user: user, agent: agent, scope: scope })
)

;; Convenience: check all 4 default scopes at once.
(define-read-only (get-all-default-scopes (user principal) (agent principal))
  {
    cancel:  (is-authorized user agent SCOPE-CANCEL),
    pause:   (is-authorized user agent SCOPE-PAUSE),
    remind:  (is-authorized user agent SCOPE-REMIND),
    analyze: (is-authorized user agent SCOPE-ANALYZE),
  }
)

(define-read-only (get-owner)
  (var-get contract-owner)
)

(define-read-only (get-sam-agent)
  (var-get sam-agent)
)

;; -- Public -------------------------------------------------------------------

;; User grants an agent a specific scope.
;;   expiry = u0  -> permanent
;;   expiry = N   -> expires at block-height N (exclusive: block N itself is unauthorized)
;; Reverts ERR-EXPIRED-ON-ARRIVAL if expiry is non-zero and already <= block-height.
(define-public (authorize (agent principal) (scope uint) (expiry uint))
  (begin
    (asserts! (or (is-eq expiry u0) (> expiry block-height)) ERR-EXPIRED-ON-ARRIVAL)
    (map-set permissions { user: tx-sender, agent: agent, scope: scope } expiry)
    (print { event: "authorized", user: tx-sender, agent: agent, scope: scope, expiry: expiry })
    (ok true)
  )
)

;; User revokes a single scope. No-op if never granted.
(define-public (revoke (agent principal) (scope uint))
  (begin
    (map-delete permissions { user: tx-sender, agent: agent, scope: scope })
    (print { event: "revoked", user: tx-sender, agent: agent, scope: scope })
    (ok true)
  )
)

;; Revoke all 4 standard SAM scopes at once.
(define-public (revoke-all (agent principal))
  (begin
    (map-delete permissions { user: tx-sender, agent: agent, scope: SCOPE-CANCEL })
    (map-delete permissions { user: tx-sender, agent: agent, scope: SCOPE-PAUSE })
    (map-delete permissions { user: tx-sender, agent: agent, scope: SCOPE-REMIND })
    (map-delete permissions { user: tx-sender, agent: agent, scope: SCOPE-ANALYZE })
    (print { event: "revoked-all", user: tx-sender, agent: agent })
    (ok true)
  )
)

;; Grant all 4 standard scopes permanently -- called during user onboarding.
(define-public (grant-default-scopes (agent principal))
  (begin
    (map-set permissions { user: tx-sender, agent: agent, scope: SCOPE-CANCEL }  u0)
    (map-set permissions { user: tx-sender, agent: agent, scope: SCOPE-PAUSE }   u0)
    (map-set permissions { user: tx-sender, agent: agent, scope: SCOPE-REMIND }  u0)
    (map-set permissions { user: tx-sender, agent: agent, scope: SCOPE-ANALYZE } u0)
    (print { event: "granted-defaults", user: tx-sender, agent: agent })
    (ok true)
  )
)

;; Owner: rotate the canonical SAM agent address.
(define-public (update-agent (new-agent principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
    (print { event: "agent-updated", old-agent: (var-get sam-agent), new-agent: new-agent })
    (var-set sam-agent new-agent)
    (ok true)
  )
)

;; Owner: transfer contract ownership.
(define-public (transfer-ownership (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
    (print { event: "ownership-transferred", old-owner: (var-get contract-owner), new-owner: new-owner })
    (var-set contract-owner new-owner)
    (ok true)
  )
)
