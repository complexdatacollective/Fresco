/* eslint-env jest */

import React from 'react';
import { shallow, mount } from 'enzyme';
import { Dialogs } from '../Dialogs';

jest.mock('../../utils/CSSVariables');

const warningDialog = () => ({
  id: Math.random(),
  type: 'Warning',
  title: 'Warning!',
  text: 'Something happened',
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
});

const confirmDialog = () => ({
  id: Math.random(),
  type: 'Confirm',
  title: 'Do you want to confirm the thing?',
  text: 'We might have more details here',
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
});

const noticeDialog = () => ({
  id: Math.random(),
  type: 'Notice',
  title: 'Hi',
  text: 'Notice me',
  onConfirm: jest.fn(),
});

const makeDialogs = () => ([
  warningDialog(),
  confirmDialog(),
  noticeDialog(),
]);

const makeProps = () => ({
  closeDialog: jest.fn(),
});

describe('<Dialogs />', () => {
  it('Renders nothing when dialogs empty', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const component = shallow(<Dialogs {...makeProps()} />);
    expect(component.find('Warning').length).toBe(0);
    expect(component.find('Confirm').length).toBe(0);
    expect(component.find('Notice').length).toBe(0);
  });

  it('It renders dialogs', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const component = shallow(<Dialogs {...makeProps()} dialogs={makeDialogs()} />);
    expect(component.find('Warning').length).toBe(1);
    expect(component.find('Confirm').length).toBe(1);
    expect(component.find('Notice').length).toBe(1);
  });

  describe('handles confirm/cancel callbacks', () => {
    it('Wires up <Warning /> Dialog', () => {
      const mockProps = makeProps();
      const mockWarningDialog = warningDialog();
      // eslint-disable-next-line react/jsx-props-no-spreading
      const component = mount(<Dialogs {...mockProps} dialogs={[mockWarningDialog]} />);

      component.find('Warning button').at(1)
        .simulate('click');
      expect(mockWarningDialog.onConfirm.mock.calls.length).toBe(1);
      expect(mockProps.closeDialog.mock.calls.length).toBe(1);

      component.find('Warning button').at(0)
        .simulate('click');
      expect(mockWarningDialog.onCancel.mock.calls.length).toBe(1);
      expect(mockProps.closeDialog.mock.calls.length).toBe(2);
    });

    it('Wires up <Notice /> Dialog', () => {
      const mockProps = makeProps();
      const mockNoticeDialog = noticeDialog();
      // eslint-disable-next-line react/jsx-props-no-spreading
      const component = mount(<Dialogs {...mockProps} dialogs={[mockNoticeDialog]} />);

      component.find('Notice button').at(0).simulate('click');
      expect(mockNoticeDialog.onConfirm.mock.calls.length).toBe(1);
      expect(mockProps.closeDialog.mock.calls.length).toBe(1);
    });

    it('Wires up <Confirm /> Dialog', () => {
      const mockProps = makeProps();
      const mockConfirmDialog = confirmDialog();
      // eslint-disable-next-line react/jsx-props-no-spreading
      const component = mount(<Dialogs {...mockProps} dialogs={[mockConfirmDialog]} />);

      component.find('Confirm button').at(1)
        .simulate('click');
      expect(mockConfirmDialog.onConfirm.mock.calls.length).toBe(1);
      expect(mockProps.closeDialog.mock.calls.length).toBe(1);

      component.find('Confirm button').at(0)
        .simulate('click');
      expect(mockConfirmDialog.onCancel.mock.calls.length).toBe(1);
      expect(mockProps.closeDialog.mock.calls.length).toBe(2);
    });
  });
});
