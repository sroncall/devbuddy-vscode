export type CustomCommand = {
  name: string;
  command: string;
};

export type DashboardMessage = {
  type?: string;
  index?: number;
  name?: string;
  command?: string;
};