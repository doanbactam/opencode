#!/usr/bin/env bun

import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import * as NodeServices from "@effect/platform-node/NodeServices"
import * as Effect from "effect/Effect"
import { Commands } from "./commands/commands"
import { Runtime } from "./framework/runtime"
import { Daemon } from "opencode/cli/daemon"

const Handlers = Runtime.handlers(Commands, {
  $: () => import("./commands/handlers/default"),
  api: () => import("./commands/handlers/api"),
  debug: {
    agents: () => import("./commands/handlers/debug/agents"),
  },
  migrate: () => import("./commands/handlers/migrate"),
  serve: () => import("./commands/handlers/serve"),
})

Runtime.run(Commands, Handlers, { version: "local" }).pipe(
  Effect.provide(Daemon.layer),
  Effect.provide(NodeServices.layer),
  Effect.scoped,
  NodeRuntime.runMain,
)
