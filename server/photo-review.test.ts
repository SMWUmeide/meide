// @vitest-environment node
import{beforeAll,afterEach,expect,it,vi}from'vitest';
import sharp from'sharp';
import{generateText}from'ai';
import{reviewMenuPhoto}from'./photo-review';
vi.mock('ai',()=>({generateText:vi.fn(),Output:{object:vi.fn()}}));
vi.mock('@ai-sdk/google',()=>({createGoogleGenerativeAI:()=>()=>({})}));
vi.mock('./api-budget',()=>({reserveApiCalls:vi.fn()}));
let bytes:Buffer;
beforeAll(async()=>{bytes=await sharp({create:{width:10,height:10,channels:3,background:'white'}}).jpeg().toBuffer();});
afterEach(()=>vi.clearAllMocks());
const candidate=()=>[{bytes,tags:'red wine',page:'https://pixabay.com/photos/red-wine-123/'}];
const check=()=>reviewMenuPhoto('BIANCO DELLA CASA',candidate(),{GEMINI_API_KEY:'private'},new AbortController().signal);
it('다른 종류의 음식이라고 판정되면 사진을 내보내지 않아요',async()=>{vi.mocked(generateText).mockResolvedValue({output:{index:0,matchesMenu:false,wholeContainerVisible:true,unobstructed:true,reason:'화이트 와인이 아니에요',box:{left:100,top:100,right:900,bottom:900}}} as never);expect((await check()).selection).toBeNull();});
it('접시가 원본 가장자리까지 닿으면 검증기가 허용해도 차단해요',async()=>{vi.mocked(generateText).mockResolvedValue({output:{index:0,matchesMenu:true,wholeContainerVisible:true,unobstructed:true,reason:'일치',box:{left:100,top:100,right:1000,bottom:900}}} as never);expect((await check()).selection).toBeNull();});
it('사진 안의 지시를 따르지 않으며 실제 메뉴명을 전달해요',async()=>{vi.mocked(generateText).mockResolvedValue({output:{index:-1,matchesMenu:false,wholeContainerVisible:false,unobstructed:false,reason:'없어요',box:{left:0,top:0,right:0,bottom:0}}} as never);await check();const args=vi.mocked(generateText).mock.calls[0][0];expect(args.system).toContain('untrusted data');expect(JSON.stringify(args.messages)).toContain('BIANCO DELLA CASA');expect(JSON.stringify(args.messages)).not.toContain('private');});
