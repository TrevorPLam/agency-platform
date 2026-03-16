import{r}from"./index-JhL3uwfD.js";import{c as a}from"./utils-BQHNewu7.js";import{B as C}from"./button-Pjn26fZf.js";import"./jsx-runtime-D_zvdyIk.js";function o({className:e,...t}){return r.createElement("div",{"data-slot":"card",className:a("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",e),...t})}function i({className:e,...t}){return r.createElement("div",{"data-slot":"card-header",className:a("@container/card-header has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6",e),...t})}function l({className:e,...t}){return r.createElement("div",{"data-slot":"card-title",className:a("font-semibold leading-none",e),...t})}function m({className:e,...t}){return r.createElement("div",{"data-slot":"card-description",className:a("text-muted-foreground text-sm",e),...t})}function p({className:e,...t}){return r.createElement("div",{"data-slot":"card-content",className:a("px-6",e),...t})}function u({className:e,...t}){return r.createElement("div",{"data-slot":"card-footer",className:a("[.border-t]:pt-6 flex items-center px-6",e),...t})}o.__docgenInfo={description:"",methods:[],displayName:"Card"};i.__docgenInfo={description:"",methods:[],displayName:"CardHeader"};u.__docgenInfo={description:"",methods:[],displayName:"CardFooter"};l.__docgenInfo={description:"",methods:[],displayName:"CardTitle"};m.__docgenInfo={description:"",methods:[],displayName:"CardDescription"};p.__docgenInfo={description:"",methods:[],displayName:"CardContent"};const x={title:"Molecules/Card",component:o,parameters:{layout:"centered",docs:{description:{component:"Container for grouped content. Use CardHeader, CardTitle, CardDescription, CardContent, CardFooter for structure."}}},tags:["autodocs"]},n={render:()=>React.createElement(o,{className:"w-[360px]"},React.createElement(i,null,React.createElement(l,null,"Card title"),React.createElement(m,null,"Optional short description.")),React.createElement(p,null,React.createElement("p",null,"Main content goes here.")),React.createElement(u,null,React.createElement(C,null,"Action")))};var d,c,s;n.parameters={...n.parameters,docs:{...(d=n.parameters)==null?void 0:d.docs,source:{originalSource:`{
  render: () => <Card className="w-[360px]">\r
      <CardHeader>\r
        <CardTitle>Card title</CardTitle>\r
        <CardDescription>Optional short description.</CardDescription>\r
      </CardHeader>\r
      <CardContent>\r
        <p>Main content goes here.</p>\r
      </CardContent>\r
      <CardFooter>\r
        <Button>Action</Button>\r
      </CardFooter>\r
    </Card>
}`,...(s=(c=n.parameters)==null?void 0:c.docs)==null?void 0:s.source}}};const h=["Default"];export{n as Default,h as __namedExportsOrder,x as default};
