export type Status = 'To Do' | 'In Progress' | 'Done';

export type Priority = 'High' | 'Medium' | 'Low';

export interface Task {
  id: number;
  title: string;
  description: string;
  tags: string[];
  priority: Priority;
  status: Status;
  due?: string;
}

export interface Column {
  name: Status;
  color: string;
}
