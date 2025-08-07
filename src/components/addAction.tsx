import { PlusCircleOutlined } from "@ant-design/icons";
import { Button } from "antd";
import React from "react";

interface AddActionProps {
  title: React.ReactNode;
  onClick: () => void;
}

const AddAction = ({ title, onClick }: AddActionProps) => {
  return (
    <Button icon={<PlusCircleOutlined />} type="default" onClick={onClick} shape="round">
      {title}
    </Button>
  );
};

export default AddAction;
