import { Avatar, AvatarGroup } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { ranking, restaurant } from "@/data/mock-menu";
import { figmaAssets } from "@/data/figma-assets";
const assets = figmaAssets["515-945"];
export function Home({ go, notify, recentName, onRanking }: { go: (route: string) => void; notify: (message: string) => void; recentName: string; onRanking: (id: string) => void }) {
  const soon = () => notify("준비 중이에요");
  return <><main className="page home" data-screen="home">
    <div className="home-top"><button className="location t-body-sm" onClick={soon}><img src={assets.imgIcon} alt="" />{restaurant.location}</button><AvatarGroup><Avatar person="me" initial="나" /><Avatar person="companion-1" initial="김" /></AvatarGroup></div>
    <h1 className="t-headline-lg home-headline">메뉴판을 찍으면<br />번역부터 주문까지</h1>
    <div className="home-shortcuts"><Card as="button" onClick={() => go("menu")}><img src={assets.imgIcon1} alt="" /><strong className="t-title-md">방금 본 메뉴판</strong><span className="t-body-sm muted">{recentName}</span></Card><Card as="button" onClick={soon}><img src={assets.imgIcon2} alt="" /><strong className="t-title-md">평가 안 한 메뉴</strong><span className="t-body-sm muted">3개</span><span className="notification-dot" /></Card></div>
    <Card padding="none" className="home-discovery"><button className="discovery-row t-body-md" onClick={soon}><img src={assets.imgIcon3} alt="" />내 주변 식당 찾기<img src={assets.img20} alt="" /></button><hr /><button className="discovery-row t-body-md" onClick={soon}><img src={assets.imgIcon4} alt="" />아시안·한식당 추천<img src={assets.img20} alt="" /></button></Card>
    <Card className="home-ranking"><div className="section-heading"><h2 className="t-headline-md">한국인 입맛 랭킹</h2><button className="text-action t-body-sm" onClick={() => go("menu")}>전체 보기 ›</button></div><ol>{ranking.map((item, index) => <li key={item.id}><button className="ranking-row" onClick={() => onRanking(item.id)}><img className="ranking-photo" src={item.photo} alt={`${item.name} 예시 사진`} /><span className="rank t-label-md">{index + 1}</span><span className="ranking-name t-body-md">{item.name}</span><span className="t-label-md"><span className="rating-star" aria-label="별점">★</span> {item.score}</span></button></li>)}</ol></Card>
    <p className="t-body-sm muted demo-note">예시 메뉴·사진·평점으로 둘러보고 있어요</p>
  </main><nav className="home-nav" aria-label="하단 메뉴"><img className="home-nav-bg" src={assets.imgBg} alt="" /><div className="home-nav-items"><button aria-current="page" onClick={() => go("home")}><img src={assets.imgIcon5} alt="" /><span>홈</span></button><button onClick={soon}><img src={assets.imgIcon6} alt="" /><span>주문내역</span></button><button className="camera-orb" aria-label="메뉴판 찍기" onClick={() => go("capture")}><img src={assets.imgIconCamera} alt="" /></button><button onClick={soon}><img src={assets.imgIcon7} alt="" /><span>동반인</span></button><button onClick={soon}><img src={assets.imgTablerUserCircle} alt="" /><span>마이페이지</span></button></div></nav></>;
}
