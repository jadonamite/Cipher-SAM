// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * SAMPolicy — ERC8004-inspired programmable agent permissions
 * Chain: Celo mainnet
 *
 * Each user grants SAM's agent EOA specific execution scopes.
 * Scopes are time-bounded and revocable at any time.
 * The agent must pass isAuthorized() before executing any autonomous action.
 *
 * Scopes:
 *   SCOPE_CANCEL  = keccak256("sam.cancel")
 *   SCOPE_PAUSE   = keccak256("sam.pause")
 *   SCOPE_REMIND  = keccak256("sam.remind")
 *   SCOPE_ANALYZE = keccak256("sam.analyze")
 */
contract SAMPolicy {
    address public owner;
    address public samAgent;

    // user => agent => scope => expiry timestamp (uint256.max = no expiry)
    mapping(address => mapping(address => mapping(bytes32 => uint256))) public permissions;

    bytes32 public constant SCOPE_CANCEL  = keccak256("sam.cancel");
    bytes32 public constant SCOPE_PAUSE   = keccak256("sam.pause");
    bytes32 public constant SCOPE_REMIND  = keccak256("sam.remind");
    bytes32 public constant SCOPE_ANALYZE = keccak256("sam.analyze");

    event Authorized(address indexed user, address indexed agent, bytes32 indexed scope, uint256 expiry);
    event Revoked(address indexed user, address indexed agent, bytes32 indexed scope);
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);

    modifier onlyOwner() {
        require(msg.sender == owner, "SAMPolicy: not owner");
        _;
    }

    constructor(address _samAgent) {
        owner = msg.sender;
        samAgent = _samAgent;
    }

    // User grants a single scope to an agent, with optional expiry (0 = no expiry)
    function authorize(address agent, bytes32 scope, uint256 expiry) external {
        uint256 stored = expiry == 0 ? type(uint256).max : expiry;
        permissions[msg.sender][agent][scope] = stored;
        emit Authorized(msg.sender, agent, scope, stored);
    }

    // User revokes a single scope
    function revoke(address agent, bytes32 scope) external {
        permissions[msg.sender][agent][scope] = 0;
        emit Revoked(msg.sender, agent, scope);
    }

    // Revoke all SAM scopes at once
    function revokeAll(address agent) external {
        permissions[msg.sender][agent][SCOPE_CANCEL]  = 0;
        permissions[msg.sender][agent][SCOPE_PAUSE]   = 0;
        permissions[msg.sender][agent][SCOPE_REMIND]  = 0;
        permissions[msg.sender][agent][SCOPE_ANALYZE] = 0;
        emit Revoked(msg.sender, agent, SCOPE_CANCEL);
        emit Revoked(msg.sender, agent, SCOPE_PAUSE);
        emit Revoked(msg.sender, agent, SCOPE_REMIND);
        emit Revoked(msg.sender, agent, SCOPE_ANALYZE);
    }

    // Grant all standard SAM scopes (no expiry) — called during onboarding
    function grantDefaultScopes(address agent) external {
        permissions[msg.sender][agent][SCOPE_CANCEL]  = type(uint256).max;
        permissions[msg.sender][agent][SCOPE_PAUSE]   = type(uint256).max;
        permissions[msg.sender][agent][SCOPE_REMIND]  = type(uint256).max;
        permissions[msg.sender][agent][SCOPE_ANALYZE] = type(uint256).max;
        emit Authorized(msg.sender, agent, SCOPE_CANCEL,  type(uint256).max);
        emit Authorized(msg.sender, agent, SCOPE_PAUSE,   type(uint256).max);
        emit Authorized(msg.sender, agent, SCOPE_REMIND,  type(uint256).max);
        emit Authorized(msg.sender, agent, SCOPE_ANALYZE, type(uint256).max);
    }

    // Check if an agent is authorized to execute a specific scope for a user
    function isAuthorized(address user, address agent, bytes32 scope) external view returns (bool) {
        uint256 expiry = permissions[user][agent][scope];
        if (expiry == 0) return false;
        if (expiry == type(uint256).max) return true;
        return block.timestamp < expiry;
    }

    // Owner: update the canonical SAM agent address
    function updateAgent(address newAgent) external onlyOwner {
        emit AgentUpdated(samAgent, newAgent);
        samAgent = newAgent;
    }
}
