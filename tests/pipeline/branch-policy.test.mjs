import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkBranch} from '../../scripts/check-branch-policy.mjs';
test('feature PR targets develop; cannot bypass staging into main',()=>{assert.equal(checkBranch({eventName:'pull_request',head:'feature/cart',base:'develop'}),true);assert.throws(()=>checkBranch({eventName:'pull_request',head:'feature/cart',base:'main'}));});
test('release requires develop from the same repository',()=>{assert.equal(checkBranch({eventName:'pull_request',head:'develop',base:'main'}),true);assert.throws(()=>checkBranch({eventName:'pull_request',head:'develop',base:'main',sameRepository:false}));});
test('hotfix goes to main and main syncs back to develop',()=>{assert.equal(checkBranch({eventName:'pull_request',head:'hotfix/login',base:'main'}),true);assert.equal(checkBranch({eventName:'pull_request',head:'main',base:'develop'}),true);});
test('rejects misspelled, empty and malformed branch names',()=>{for(const branch of ['dev','developer','fearture/cart','feature/','feature/a b','feature/A'])assert.throws(()=>checkBranch({eventName:'push',branch}));});
test('only integration/release branches support manual publishing',()=>{for(const branch of ['main','develop'])assert.equal(checkBranch({eventName:'workflow_dispatch',branch}),true);assert.throws(()=>checkBranch({eventName:'workflow_dispatch',branch:'feature/cart'}));});
