export type CssObject = Record<string, Record<string, unknown>>;

// TODO: use disableFlags
export type DisableFlag = "rain" | "nav" | "rounded-image";

export type ListGroup = {
  icon: string;
  items: ListItem[];
};

export type ListItem = {
  text?: string;
  icon?: string;
  link?: string;
};

export type ConfigObject = {
  name: string;
  disable: DisableFlag[];
  description: string;
  image: string;
  favicon: string;
  twitter: string;
  list: {
    [key: string]: ListGroup;
  };
};
