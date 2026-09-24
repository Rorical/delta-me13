// 档案架布局：一排透视的档案框，文件夹分组分布其中。
// 地图与进度条共用这里的坐标，使「光束」能从选中组一直落到进度条上。

export const RACK_SLOTS = 44;      // 档案框总数
export const GROUP_SIZE = 4;       // 每个文件夹占用的框数

// 第 index 个文件夹在档案架上的起始框序号
export function groupStartSlot(index: number, count: number): number {
  const margin = 3;
  const span = RACK_SLOTS - margin * 2 - GROUP_SIZE;
  return Math.round(margin + (count <= 1 ? span / 2 : (span * index) / (count - 1)));
}

// 该文件夹组中心的横向百分比
export function groupCenterPercent(index: number, count: number): number {
  const start = groupStartSlot(index, count);
  return ((start + GROUP_SIZE / 2) / RACK_SLOTS) * 100;
}
