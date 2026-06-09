const params=

new URLSearchParams(

window.location.search

);

const assignmentId=

params.get(

'assignId'

);

const courseId=

params.get(

'courseId'

);


if(

!assignmentId ||

!courseId

){

window.location.replace(

'dashboard.html'

);

}


Promise.all([

fetch(

`/assignments/${courseId}`,

{

credentials:'include'

}

)

.then(

r=>r.ok ?

r.json()

:

[]

)

])

.then(

([assignments])=>{

const assignment=

assignments.find(

a=>a.id==assignmentId

);

if(

!assignment

){

window.location.replace(

'course.html?id='+courseId

);

return;

}

renderAssignment(

assignment

);

})

.catch(

()=>{

window.location.replace(

'course.html?id='+courseId

);

}

);


function renderAssignment(

assignment

){

const due=

assignment.due_date ?

new Date(

assignment.due_date

).toLocaleString()

:

'No Due Date';

document.getElementById(

'assignmentBox'

).innerHTML=

`

<h2>

${assignment.title}

</h2>

<p>

${assignment.description ||

'No description'

}

</p>

<p>

<strong>

Due:

</strong>

${due}

</p>

<br>

<form id="submitForm">

<input

type="file"

required

>

<br><br>

<button>

Submit Assignment

</button>

</form>

<div id="msg"></div>

`;

document

.getElementById(

'submitForm'

)

.addEventListener(

'submit',

submitAssignment

);

}


async function submitAssignment(

e

){

e.preventDefault();

const file=

document.querySelector(

'input[type=file]'

).files[0];

const form=

new FormData();

form.append(

'assignment_id',

assignmentId

);

form.append(

'file',

file

);

const res=

await fetch(

'/submit-assignment',

{

method:'POST',

credentials:'include',

body:form

}

);

const data=

await res.json();

document.getElementById(

'msg'

).textContent=

data.message;

}