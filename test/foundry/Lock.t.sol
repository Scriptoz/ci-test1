// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "forge-std/Test.sol";

import "../../contracts/Lock.sol";

contract LockTest is Test {
    Lock lock;

    function setUp() public {
        lock = new Lock(100000000000);
    }

    function test() public {
        assertTrue(true);
    }
}
