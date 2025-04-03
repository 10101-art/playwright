"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebExtension = exports.Storage = exports.Session = exports.Script = exports.Network = exports.Log = exports.Input = exports.ErrorCode = exports.BrowsingContext = exports.Browser = void 0;
/**
 * @license
 * Copyright 2024 Google Inc.
 * Modifications copyright (c) Microsoft Corporation.
 * SPDX-License-Identifier: Apache-2.0
 */
// Copied from upstream: https://github.com/GoogleChromeLabs/chromium-bidi/blob/main/src/protocol/generated/webdriver-bidi.ts
/**
 * THIS FILE IS AUTOGENERATED by cddlconv 0.1.6.
 * Run `node tools/generate-bidi-types.mjs` to regenerate.
 * @see https://github.com/w3c/webdriver-bidi/blob/master/index.bs
 */
/**
 * Must be between `-9007199254740991` and `9007199254740991`, inclusive.
 */
/**
 * Must be between `0` and `9007199254740991`, inclusive.
 */
let ErrorCode = exports.ErrorCode = /*#__PURE__*/function (ErrorCode) {
  ErrorCode["InvalidArgument"] = "invalid argument";
  ErrorCode["InvalidSelector"] = "invalid selector";
  ErrorCode["InvalidSessionId"] = "invalid session id";
  ErrorCode["InvalidWebExtension"] = "invalid web extension";
  ErrorCode["MoveTargetOutOfBounds"] = "move target out of bounds";
  ErrorCode["NoSuchAlert"] = "no such alert";
  ErrorCode["NoSuchElement"] = "no such element";
  ErrorCode["NoSuchFrame"] = "no such frame";
  ErrorCode["NoSuchHandle"] = "no such handle";
  ErrorCode["NoSuchHistoryEntry"] = "no such history entry";
  ErrorCode["NoSuchIntercept"] = "no such intercept";
  ErrorCode["NoSuchNode"] = "no such node";
  ErrorCode["NoSuchRequest"] = "no such request";
  ErrorCode["NoSuchScript"] = "no such script";
  ErrorCode["NoSuchStoragePartition"] = "no such storage partition";
  ErrorCode["NoSuchUserContext"] = "no such user context";
  ErrorCode["NoSuchWebExtension"] = "no such web extension";
  ErrorCode["SessionNotCreated"] = "session not created";
  ErrorCode["UnableToCaptureScreen"] = "unable to capture screen";
  ErrorCode["UnableToCloseBrowser"] = "unable to close browser";
  ErrorCode["UnableToSetCookie"] = "unable to set cookie";
  ErrorCode["UnableToSetFileInput"] = "unable to set file input";
  ErrorCode["UnderspecifiedStoragePartition"] = "underspecified storage partition";
  ErrorCode["UnknownCommand"] = "unknown command";
  ErrorCode["UnknownError"] = "unknown error";
  ErrorCode["UnsupportedOperation"] = "unsupported operation";
  return ErrorCode;
}({});
let Session = exports.Session = void 0;
(function (_Session10) {
  let UserPromptHandlerType = /*#__PURE__*/function (UserPromptHandlerType) {
    UserPromptHandlerType["Accept"] = "accept";
    UserPromptHandlerType["Dismiss"] = "dismiss";
    UserPromptHandlerType["Ignore"] = "ignore";
    return UserPromptHandlerType;
  }({});
  _Session10.UserPromptHandlerType = UserPromptHandlerType;
})(Session || (exports.Session = Session = {}));
let Browser = exports.Browser = void 0;
let BrowsingContext = exports.BrowsingContext = void 0;
(function (_BrowsingContext11) {
  let ReadinessState = /*#__PURE__*/function (ReadinessState) {
    ReadinessState["None"] = "none";
    ReadinessState["Interactive"] = "interactive";
    ReadinessState["Complete"] = "complete";
    return ReadinessState;
  }({});
  _BrowsingContext11.ReadinessState = ReadinessState;
})(BrowsingContext || (exports.BrowsingContext = BrowsingContext = {}));
(function (_BrowsingContext12) {
  let UserPromptType = /*#__PURE__*/function (UserPromptType) {
    UserPromptType["Alert"] = "alert";
    UserPromptType["Beforeunload"] = "beforeunload";
    UserPromptType["Confirm"] = "confirm";
    UserPromptType["Prompt"] = "prompt";
    return UserPromptType;
  }({});
  _BrowsingContext12.UserPromptType = UserPromptType;
})(BrowsingContext || (exports.BrowsingContext = BrowsingContext = {}));
(function (_BrowsingContext25) {
  let CreateType = /*#__PURE__*/function (CreateType) {
    CreateType["Tab"] = "tab";
    CreateType["Window"] = "window";
    return CreateType;
  }({});
  _BrowsingContext25.CreateType = CreateType;
})(BrowsingContext || (exports.BrowsingContext = BrowsingContext = {}));
let Network = exports.Network = void 0;
(function (_Network6) {
  let SameSite = /*#__PURE__*/function (SameSite) {
    SameSite["Strict"] = "strict";
    SameSite["Lax"] = "lax";
    SameSite["None"] = "none";
    return SameSite;
  }({});
  _Network6.SameSite = SameSite;
})(Network || (exports.Network = Network = {}));
(function (_Network23) {
  let InterceptPhase = /*#__PURE__*/function (InterceptPhase) {
    InterceptPhase["BeforeRequestSent"] = "beforeRequestSent";
    InterceptPhase["ResponseStarted"] = "responseStarted";
    InterceptPhase["AuthRequired"] = "authRequired";
    return InterceptPhase;
  }({});
  _Network23.InterceptPhase = InterceptPhase;
})(Network || (exports.Network = Network = {}));
let Script = exports.Script = void 0;
(function (_Script68) {
  let ResultOwnership = /*#__PURE__*/function (ResultOwnership) {
    ResultOwnership["Root"] = "root";
    ResultOwnership["None"] = "none";
    return ResultOwnership;
  }({});
  _Script68.ResultOwnership = ResultOwnership;
})(Script || (exports.Script = Script = {}));
let Storage = exports.Storage = void 0;
let Log = exports.Log = void 0;
(function (_Log7) {
  let Level = /*#__PURE__*/function (Level) {
    Level["Debug"] = "debug";
    Level["Info"] = "info";
    Level["Warn"] = "warn";
    Level["Error"] = "error";
    return Level;
  }({});
  _Log7.Level = Level;
})(Log || (exports.Log = Log = {}));
let Input = exports.Input = void 0;
(function (_Input9) {
  let PointerType = /*#__PURE__*/function (PointerType) {
    PointerType["Mouse"] = "mouse";
    PointerType["Pen"] = "pen";
    PointerType["Touch"] = "touch";
    return PointerType;
  }({});
  _Input9.PointerType = PointerType;
})(Input || (exports.Input = Input = {}));
let WebExtension = exports.WebExtension = void 0;