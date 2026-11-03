import {test} from 'node:test';import assert from 'node:assert/strict';
import {resolveAssetOrigin} from '../asset-origin.ts';
const production='https://fabioegypt.com';
test('production assets always stay on production despite test-only host overrides',()=>assert.equal(resolveAssetOrigin(false,production,'https://test.example','test.vercel.app'),production));
test('test uses its deployment URL automatically, with optional stable-origin override',()=>{assert.equal(resolveAssetOrigin(true,production,undefined,'test.vercel.app'),'https://test.vercel.app');assert.equal(resolveAssetOrigin(true,production,'https://stable.vercel.app/','test.vercel.app'),'https://stable.vercel.app');});
test('test cannot silently fall back to old production, credentials or non-origin URLs',()=>{assert.throws(()=>resolveAssetOrigin(true,production),/require/);for(const url of [production,'http://test.example','https://user:pass@test.example','https://test.example/path','https://test.example/?token=secret'])assert.throws(()=>resolveAssetOrigin(true,production,url));assert.equal(resolveAssetOrigin(true,production,'http://127.0.0.1:4322'),'http://127.0.0.1:4322');});
