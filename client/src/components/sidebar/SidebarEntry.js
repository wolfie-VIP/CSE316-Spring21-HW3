import React, { useState }  from 'react';
import { WNavItem, WInput } from 'wt-frontend';

const SidebarEntry = (props) => {
    const [editing, toggleEditing] = useState(false);
    const [preEdit, setPreEdit] = useState(props.name);

    const handleEditing = (e) => {
        e.stopPropagation();
        setPreEdit(props.name);
        toggleEditing(!editing);
    };

    const handleSubmit = (e) => {
        handleEditing(e);
        const { name, value } = e.target;
        props.updateListField(props._id, name, value, preEdit);
    };

    const entryStyle = props.id === props.activeid ? 'list-item list-item-active' : 'list-item ';
    
    return (
        <WNavItem 
            className={entryStyle} onDoubleClick={handleEditing} 
            onClick={() => { props.handleSetActive(props.id) }} hoverAnimation="lighten"
        >
            {
                editing ? <WInput className="list-item-edit" inputClass="list-item-edit-input" wType="lined" barAnimation="solid" name='name' onBlur={handleSubmit} autoFocus={true} defaultValue={props.name} />
                    :   <div className='list-text'>
                            {props.name}
                        </div>
            }
        </WNavItem>
    );
};

export default SidebarEntry;