import { NodeFileSystem } from "@effect/platform-node"
import { EOL } from "os"
import { Effect } from "effect"
import { Daemon } from "../daemon"
import { cmd } from "./cmd"
import { effectCmd, fail } from "../effect-cmd"

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

const withDaemon = <A>(effect: Effect.Effect<A, unknown, Daemon.Service>) =>
  effect.pipe(
    Effect.catch((error) => fail(errorMessage(error))),
    Effect.provide(Daemon.layer),
    Effect.provide(NodeFileSystem.layer),
  )

const StartCommand = effectCmd({
  command: "start",
  describe: "start the background server",
  instance: false,
  handler: () =>
    withDaemon(
      Effect.gen(function* () {
        const daemon = yield* Daemon.Service
        return yield* daemon.start()
      }),
    ).pipe(Effect.tap((url) => Effect.sync(() => process.stdout.write(url + EOL)))),
})

const StopCommand = effectCmd({
  command: "stop",
  describe: "stop the background server",
  instance: false,
  handler: () =>
    withDaemon(
      Effect.gen(function* () {
        const daemon = yield* Daemon.Service
        yield* daemon.stop()
      }),
    ),
})

const RestartCommand = effectCmd({
  command: "restart",
  describe: "restart the background server",
  instance: false,
  handler: () =>
    withDaemon(
      Effect.gen(function* () {
        const daemon = yield* Daemon.Service
        yield* daemon.stop()
        return yield* daemon.start()
      }),
    ).pipe(Effect.tap((url) => Effect.sync(() => process.stdout.write(url + EOL)))),
})

const StatusCommand = effectCmd({
  command: "status",
  describe: "show background server status",
  instance: false,
  handler: () =>
    withDaemon(
      Effect.gen(function* () {
        const daemon = yield* Daemon.Service
        return yield* daemon.status()
      }),
    ).pipe(
      Effect.tap((url) =>
        Effect.sync(() =>
          process.stdout.write((url === undefined ? "stopped" : `running ${url}`) + EOL),
        ),
      ),
    ),
})

const PasswordCommand = effectCmd({
  command: "password [value]",
  describe: "get or set the server password",
  instance: false,
  builder: (yargs) => yargs.positional("value", { type: "string", describe: "new password" }),
  handler: (args) =>
    withDaemon(
      Effect.gen(function* () {
        const daemon = yield* Daemon.Service
        if (args.value !== undefined) yield* daemon.stop()
        return yield* daemon.password(args.value)
      }),
    ).pipe(Effect.tap((password) => Effect.sync(() => process.stdout.write(password + EOL)))),
})

export const ServiceCommand = cmd({
  command: "service",
  describe: "manage the background server",
  builder: (yargs) =>
    yargs
      .command(StartCommand)
      .command(StopCommand)
      .command(RestartCommand)
      .command(StatusCommand)
      .command(PasswordCommand)
      .demandCommand(),
  async handler() {},
})
