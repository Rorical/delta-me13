import {
  AlertTriangle, Coins, Eye, Flame, Footprints, Handshake, Infinity as InfinityIcon, MessageSquare, Swords, Terminal, Waves
} from 'lucide-vue-next';
import type { LogType } from '../../core/omphalosWorldState';

// 日志类型对应的图标（代替表情符号）
export const LOG_ICON: Record<LogType, unknown> = {
  system: Terminal,
  move: Footprints,
  chat: MessageSquare,
  combat: Swords,
  ember: Flame,
  economy: Coins,
  social: Handshake,
  tide: Waves,
  event: Eye,
  failure: AlertTriangle,
  era: InfinityIcon
};
