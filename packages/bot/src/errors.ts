enum BotErrorType {
  Request,
  Delay,
  RobotsTxt,
  Configuration,
  MemorySafety,
}

export class BotError extends Error implements Error {
  status?: number;
  type: BotErrorType = BotErrorType.Request;
}

export class RobotsRejection extends BotError implements BotError {
  type = BotErrorType.RobotsTxt;
}

export class DelayError extends BotError implements BotError {
  type = BotErrorType.Delay;
}

export class ConfigError extends BotError implements BotError {
  type = BotErrorType.Configuration;
}

export class MemoryError extends BotError implements BotError {
  type = BotErrorType.MemorySafety;
}
