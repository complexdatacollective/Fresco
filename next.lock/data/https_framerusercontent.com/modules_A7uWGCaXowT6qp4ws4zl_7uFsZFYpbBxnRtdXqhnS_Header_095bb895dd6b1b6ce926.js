// Get Started: https://www.framer.com/developers
import{jsx as _jsx}from"react/jsx-runtime";import{addPropertyControls,ControlType}from"framer";import{motion}from"framer-motion";/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */export default function Header(props){const{tint}=props;return /*#__PURE__*/_jsx(motion.div,{style:{margin:50,width:100,height:100,borderRadius:25,backgroundColor:tint},animate:{scale:1.5},whileHover:{rotate:90}});}addPropertyControls(Header,{tint:{title:"Tint",type:ControlType.Color,defaultValue:"#09F"}});
export const __FramerMetadata__ = {"exports":{"default":{"type":"reactComponent","name":"Header","slots":[],"annotations":{"framerContractVersion":"1","framerSupportedLayoutHeight":"auto","framerSupportedLayoutWidth":"auto"}},"__FramerMetadata__":{"type":"variable"}}}
//# sourceMappingURL=./Header.map