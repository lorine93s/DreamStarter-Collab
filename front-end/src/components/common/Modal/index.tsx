import { FC } from "react";

import { Modal as AntModal, ModalProps } from "antd";

const Modal: FC<ModalProps> = ({
  children,
  footer = null,
  width = 700,
  ...rest
}) => {
  return (
    <AntModal centered width={width} footer={footer} {...rest}>
      <div className="!font-raleway">{children}</div>
    </AntModal>
  );
};

export default Modal;
