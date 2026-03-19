import Link from 'next/link';

/* ─────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────── */
const C = {
  bg:        '#F7F6F2',
  white:     '#FFFFFF',
  dark:      '#1A1A18',
  secondary: '#6B6B67',
  muted:     '#9B9B97',
  border:    '#E2E2DC',
  green:     '#2D7A4F',
};

/* ─────────────────────────────────────────────────────────
   LOGO SVG (inline)
───────────────────────────────────────────────────────── */
function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="4"  y="2"  width="11" height="20" rx="2.5" fill={C.dark} />
      <rect x="10" y="10" width="11" height="20" rx="2.5" fill={C.bg} />
      <rect x="10" y="10" width="11" height="20" rx="2.5" fill={C.dark} fillOpacity="0.15" />
      <rect x="17" y="10" width="11" height="20" rx="2.5" fill={C.dark} />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   CHECK ICON
───────────────────────────────────────────────────────── */
function Check({ light = false }: { light?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <path d="M2.5 7L5.5 10L11.5 4" stroke={light ? 'rgba(255,255,255,0.35)' : C.green}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div style={{ backgroundColor: C.bg, color: C.dark, fontFamily: 'Inter, sans-serif' }}>

      {/* ══════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════ */}
      <nav style={{
        backgroundColor: C.bg,
        borderBottom: `1px solid ${C.border}`,
        height: '60px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
      }} className="px-6 md:px-12">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Logo />
          <span style={{ fontWeight: 500, fontSize: '16px', color: C.dark, fontFamily: 'Inter, sans-serif' }}>
            MixPower
          </span>
        </div>

        {/* Center links — hidden on mobile */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: '32px' }}>
          {['Producto', 'Casos de uso', 'Precios'].map(l => (
            <a key={l} href={l === 'Precios' ? '#precios' : '#'}
              style={{ fontSize: '14px', color: C.secondary, textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}
              className="hover:text-[#1A1A18] transition-colors duration-150">
              {l}
            </a>
          ))}
        </div>

        {/* Right CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <a href="mailto:ignasi@procredis.cc" className="hidden md:block"
            style={{ fontSize: '13px', color: C.secondary, textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>
            Hablar con ventas
          </a>
          <Link href="/onboarding"
            style={{ backgroundColor: C.dark, color: C.white, borderRadius: '6px', padding: '8px 18px', fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500, textDecoration: 'none', display: 'inline-block', transition: 'opacity 0.15s ease' }}
            className="hover:opacity-80">
            <span className="hidden md:inline">Solicitar acceso</span>
            <span className="md:hidden">Acceder</span>
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="px-6 md:px-12" style={{ paddingTop: '130px', paddingBottom: '100px' }}>
        <div style={{ maxWidth: '680px' }}>

          {/* Badge */}
          <div className="anim-fade anim-d0"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: `1px solid ${C.border}`, backgroundColor: C.white, borderRadius: '100px', padding: '5px 14px', marginBottom: '40px' }}>
            <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: C.green, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: C.secondary, fontFamily: 'Inter, sans-serif' }}>
              Software comercial para fabricantes de materiales
            </span>
          </div>

          {/* H1 */}
          <h1 className="anim-fade anim-d1 text-[42px] md:text-[68px]"
            style={{ fontFamily: '"Instrument Serif", Georgia, serif', lineHeight: '1.06', letterSpacing: '-0.02em', fontWeight: 400, margin: '0 0 0 0' }}>
            Recupera el margen<br />
            <em style={{ color: C.secondary, fontStyle: 'italic' }}>que tu cartera oculta.</em>
          </h1>

          {/* Paragraph */}
          <p className="anim-fade anim-d2"
            style={{ fontWeight: 300, fontSize: '18px', color: C.secondary, lineHeight: '1.75', maxWidth: '520px', marginTop: '24px', fontFamily: 'Inter, sans-serif' }}>
            MixPower analiza el mix de producto de cada cliente distribuidor y calcula exactamente cuánto margen estás dejando sobre la mesa. Tu equipo comercial actúa con datos, no con intuición.
          </p>

          {/* Buttons */}
          <div className="anim-fade anim-d3"
            style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '40px', flexWrap: 'wrap' }}>
            <Link href="/onboarding"
              style={{ backgroundColor: C.dark, color: C.white, padding: '13px 28px', borderRadius: '7px', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 500, textDecoration: 'none', transition: 'opacity 0.15s ease', display: 'inline-block' }}
              className="hover:opacity-80">
              Solicitar acceso
            </Link>
            <a href="#como-funciona"
              style={{ color: C.secondary, fontSize: '14px', fontFamily: 'Inter, sans-serif', textDecoration: 'none', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.15s ease' }}
              className="hover:text-[#1A1A18]">
              Ver cómo funciona →
            </a>
          </div>

          {/* Social avatars */}
          <div className="anim-fade anim-d4"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '32px' }}>
            <div style={{ display: 'flex' }}>
              {[
                { init: 'JM', i: 0 },
                { init: 'AR', i: 1 },
                { init: 'PG', i: 2 },
              ].map(({ init, i }) => (
                <div key={init} style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  backgroundColor: C.border, color: C.secondary, fontSize: '11px',
                  fontFamily: 'Inter, sans-serif', fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginLeft: i > 0 ? '-8px' : 0,
                  border: `2px solid ${C.bg}`,
                  position: 'relative', zIndex: 3 - i,
                }}>
                  {init}
                </div>
              ))}
            </div>
            <span style={{ fontSize: '13px', color: C.secondary, fontFamily: 'Inter, sans-serif' }}>
              Usado por 12 directores comerciales en lista de espera
            </span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SOCIAL PROOF BAR
      ══════════════════════════════════════════════ */}
      <section className="px-6 md:px-12"
        style={{ backgroundColor: C.dark, padding: '18px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <span style={{ color: C.white, fontSize: '13px', fontWeight: 300, fontFamily: 'Inter, sans-serif' }}>
          Fabricantes con +20M€ de facturación ya en lista de espera
        </span>
        <div style={{ display: 'flex', gap: '32px' }}>
          {['Morteros del Sur', 'TecnoMort', 'Construfix'].map(n => (
            <span key={n} style={{ color: C.white, opacity: 0.4, fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>{n}</span>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          MÉTRICAS
      ══════════════════════════════════════════════ */}
      <section style={{ backgroundColor: C.white, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="grid grid-cols-1 md:grid-cols-3">
          {[
            { num: '+€800K', sub: 'margen medio recuperado por empresa en 12 meses' },
            { num: '22×',    sub: 'retorno sobre la inversión en el primer año' },
            { num: '6 sem',  sub: 'hasta ver los primeros resultados en cartera' },
          ].map(({ num, sub }) => (
            <div key={num} className="metric-col px-6 md:px-12"
              style={{ padding: '64px 48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '52px', color: C.dark, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {num}
              </span>
              <span style={{ fontSize: '13px', color: C.secondary, lineHeight: '1.5', maxWidth: '160px', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
                {sub}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PROBLEMA — editorial
      ══════════════════════════════════════════════ */}
      <section className="px-6 md:px-12" style={{ padding: '100px 48px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '80px', alignItems: 'center' }}>
          {/* Left */}
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '0.1em', color: C.muted, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', marginBottom: '24px', fontWeight: 400 }}>
              El Problema
            </p>
            <h2 className="text-[32px] md:text-[42px]"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif', lineHeight: '1.1', fontWeight: 400, margin: 0 }}>
              Tu equipo visita a los clientes equivocados.
            </h2>
            <p style={{ fontSize: '16px', color: C.secondary, lineHeight: '1.7', marginTop: '20px', fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>
              La mayoría de fabricantes gestiona por volumen. El cliente que más compra recibe más atención. Pero volumen no es margen. Un cliente de 2.000 toneladas comprando solo producto barato vale menos que uno de 800 toneladas con el mix correcto. MixPower lo hace visible.
            </p>
          </div>

          {/* Right — table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden', borderCollapse: 'collapse', minWidth: '360px' }}>
              <thead>
                <tr style={{ backgroundColor: C.bg }}>
                  {['Cliente', 'Volumen', 'Mix Power', 'Oportunidad'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: C.muted, fontWeight: 500, fontFamily: 'Inter, sans-serif', borderBottom: `1px solid ${C.border}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'García Dist.', vol: '2.000t', mp: '0.58', mpStyle: { backgroundColor: '#FEE2E2', color: '#991B1B' }, opp: '€340K' },
                  { name: 'Materiales Roca', vol: '1.500t', mp: '0.79', mpStyle: { backgroundColor: '#FEF3C7', color: '#92400E' }, opp: '€180K' },
                  { name: 'Reformas Norte', vol: '800t',   mp: '0.94', mpStyle: { backgroundColor: '#D1FAE5', color: '#065F46' }, opp: '—' },
                ].map((row, i) => (
                  <tr key={row.name} style={{ backgroundColor: i % 2 === 0 ? C.white : '#FAFAF8' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: C.dark, fontFamily: 'Inter, sans-serif', borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}>
                      {row.name}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: C.secondary, fontFamily: 'Inter, sans-serif', borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}>
                      {row.vol}
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}>
                      <span style={{ ...row.mpStyle, padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                        {row.mp}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: C.dark, fontFamily: 'Inter, sans-serif', borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}>
                      {row.opp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CÓMO FUNCIONA
      ══════════════════════════════════════════════ */}
      <section id="como-funciona" className="px-6 md:px-12" style={{ padding: '100px 48px', backgroundColor: C.bg, borderTop: `1px solid ${C.border}` }}>
        <p style={{ fontSize: '11px', letterSpacing: '0.1em', color: C.muted, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 400 }}>
          Cómo funciona
        </p>
        <h2 className="text-[32px] md:text-[40px]"
          style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400, margin: 0 }}>
          De Excel a decisión en minutos.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3" style={{ marginTop: '64px', gap: '48px' }}>
          {[
            { n: '01', title: 'Exporta tu ERP', desc: 'Un CSV con tus ventas por familia de producto. Sin integraciones. Sin IT.' },
            { n: '02', title: 'Mix Power Score', desc: 'Cada cliente recibe su puntuación. Ves de un vistazo quién tiene margen oculto y cuánto vale.' },
            { n: '03', title: 'Tu equipo actúa', desc: 'Lista priorizada de visitas con el argumentario exacto para cada cliente.' },
          ].map(step => (
            <div key={step.n}>
              <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '80px', color: C.border, lineHeight: 1, marginBottom: '16px' }}>
                {step.n}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 500, color: C.dark, fontFamily: 'Inter, sans-serif', margin: '0 0 8px 0' }}>
                {step.title}
              </h3>
              <p style={{ fontSize: '14px', color: C.secondary, fontFamily: 'Inter, sans-serif', lineHeight: '1.6', margin: 0 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TESTIMONIO
      ══════════════════════════════════════════════ */}
      <section className="px-6 md:px-12" style={{ padding: '100px 48px', backgroundColor: C.white, borderTop: `1px solid ${C.border}` }}>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '80px', alignItems: 'center' }}>
          {/* Quote */}
          <div>
            <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '80px', color: C.border, lineHeight: '0.8', marginBottom: '4px' }}>
              &ldquo;
            </div>
            <blockquote style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontSize: '28px', color: C.dark, lineHeight: '1.4', margin: 0 }}>
              En 6 meses identificamos más de €2M en oportunidad de margen que no veíamos. El equipo ahora visita con un objetivo concreto.
            </blockquote>
            <p style={{ fontSize: '13px', color: C.secondary, fontFamily: 'Inter, sans-serif', marginTop: '24px' }}>
              Jordi M. · Director General · Fabricante 80M€ facturación
            </p>
          </div>

          {/* Result card */}
          <div style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '28px' }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: C.dark, fontFamily: 'Inter, sans-serif', margin: '0 0 16px 0' }}>
              Resultado real
            </p>
            {[
              { label: 'Margen antes',           value: '13.2%',  valueColor: '#991B1B' },
              { label: 'Margen después (12M)',    value: '17.8%',  valueColor: '#065F46' },
              { label: 'Clientes trabajados',     value: '38 de 150', valueColor: C.dark },
              { label: 'Margen adicional',        value: '+€3.2M', valueColor: '#065F46' },
              { label: 'ROI sobre MixPower',      value: '22×',    valueColor: '#065F46' },
            ].map((row, i, arr) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <span style={{ fontSize: '13px', color: C.secondary, fontFamily: 'Inter, sans-serif' }}>{row.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: row.valueColor, fontFamily: 'Inter, sans-serif' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════ */}
      <section id="precios" className="px-6 md:px-12" style={{ padding: '100px 48px', backgroundColor: C.bg, borderTop: `1px solid ${C.border}` }}>
        <p style={{ fontSize: '11px', letterSpacing: '0.1em', color: C.muted, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 400 }}>
          Precios
        </p>
        <h2 className="text-[32px] md:text-[40px]"
          style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400, margin: 0 }}>
          Precio transparente.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3" style={{ marginTop: '48px', gap: '20px', alignItems: 'start' }}>

          {/* Starter */}
          <div style={{ border: `1px solid ${C.border}`, backgroundColor: C.white, borderRadius: '10px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '0' }}>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: C.muted, fontFamily: 'Inter, sans-serif', margin: '0 0 16px 0' }}>Starter</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '44px', color: C.dark, lineHeight: 1 }}>990€</span>
              <span style={{ fontSize: '13px', color: C.muted, fontFamily: 'Inter, sans-serif' }}>/mes</span>
            </div>
            <p style={{ fontSize: '13px', color: C.secondary, fontFamily: 'Inter, sans-serif', margin: '8px 0 24px 0' }}>Hasta 50 clientes en cartera</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Dashboard de priorización', 'Mix Power Score automático', 'Exportación de informes PDF', 'Soporte por email'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: C.secondary, fontFamily: 'Inter, sans-serif' }}>
                  <Check /> {f}
                </li>
              ))}
            </ul>
            <Link href="/onboarding"
              style={{ display: 'block', textAlign: 'center', padding: '11px', borderRadius: '6px', border: `1px solid ${C.border}`, fontSize: '13px', fontWeight: 500, color: C.dark, fontFamily: 'Inter, sans-serif', textDecoration: 'none', transition: 'background 0.15s ease', backgroundColor: 'transparent' }}
              className="hover:bg-[#F7F6F2]">
              Empezar
            </Link>
          </div>

          {/* Growth — featured */}
          <div style={{ border: `2px solid ${C.dark}`, backgroundColor: C.dark, borderRadius: '10px', padding: '32px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: C.secondary, fontFamily: 'Inter, sans-serif', margin: 0 }}>Growth</p>
              <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: C.white, fontSize: '11px', borderRadius: '100px', padding: '4px 12px', fontFamily: 'Inter, sans-serif' }}>
                Más popular
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '44px', color: C.white, lineHeight: 1 }}>1.990€</span>
              <span style={{ fontSize: '13px', color: C.secondary, fontFamily: 'Inter, sans-serif' }}>/mes</span>
            </div>
            <p style={{ fontSize: '13px', color: C.muted, fontFamily: 'Inter, sans-serif', margin: '8px 0 24px 0' }}>Hasta 150 clientes</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Todo lo del plan Starter', 'Hasta 150 clientes', 'Benchmarks personalizables', 'Alertas de oportunidad', 'Soporte prioritario'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: C.muted, fontFamily: 'Inter, sans-serif' }}>
                  <Check light /> {f}
                </li>
              ))}
            </ul>
            <Link href="/onboarding"
              style={{ display: 'block', textAlign: 'center', padding: '11px', borderRadius: '6px', backgroundColor: C.white, fontSize: '13px', fontWeight: 500, color: C.dark, fontFamily: 'Inter, sans-serif', textDecoration: 'none', transition: 'opacity 0.15s ease' }}
              className="hover:opacity-90">
              Empezar
            </Link>
          </div>

          {/* Enterprise */}
          <div style={{ border: `1px solid ${C.border}`, backgroundColor: C.white, borderRadius: '10px', padding: '32px', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: C.muted, fontFamily: 'Inter, sans-serif', margin: '0 0 16px 0' }}>Enterprise</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '44px', color: C.dark, lineHeight: 1 }}>3.500€</span>
              <span style={{ fontSize: '13px', color: C.muted, fontFamily: 'Inter, sans-serif' }}>/mes</span>
            </div>
            <p style={{ fontSize: '12px', color: C.secondary, fontFamily: 'Inter, sans-serif', margin: '4px 0 4px 0' }}>+ onboarding €20.000</p>
            <p style={{ fontSize: '13px', color: C.secondary, fontFamily: 'Inter, sans-serif', margin: '4px 0 24px 0' }}>Clientes ilimitados + integración ERP</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Todo lo del plan Growth', 'Clientes ilimitados', 'Integración ERP a medida', 'Onboarding dedicado', 'SLA garantizado 99.9%'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: C.secondary, fontFamily: 'Inter, sans-serif' }}>
                  <Check /> {f}
                </li>
              ))}
            </ul>
            <a href="mailto:ignasi@procredis.cc"
              style={{ display: 'block', textAlign: 'center', padding: '11px', borderRadius: '6px', border: `1px solid ${C.border}`, fontSize: '13px', fontWeight: 500, color: C.dark, fontFamily: 'Inter, sans-serif', textDecoration: 'none', transition: 'background 0.15s ease', backgroundColor: 'transparent' }}
              className="hover:bg-[#F7F6F2]">
              Contactar
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════════ */}
      <section className="px-6 md:px-12" style={{ backgroundColor: C.dark, padding: '100px 48px', textAlign: 'center' }}>
        <h2 className="text-[36px] md:text-[48px]"
          style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', color: C.white, fontWeight: 400, margin: 0, lineHeight: '1.1' }}>
          ¿Cuánto margen estás dejando sobre la mesa?
        </h2>
        <p style={{ fontWeight: 300, fontSize: '18px', color: 'rgba(255,255,255,0.6)', marginTop: '16px', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6', fontFamily: 'Inter, sans-serif' }}>
          Habla con nuestro equipo. En 30 minutos calculamos el potencial de tu cartera sin compromiso.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '40px', flexWrap: 'wrap' }}>
          <a href="mailto:ignasi@procredis.cc"
            style={{ backgroundColor: C.white, color: C.dark, padding: '13px 28px', borderRadius: '7px', fontSize: '14px', fontWeight: 500, fontFamily: 'Inter, sans-serif', textDecoration: 'none', transition: 'opacity 0.15s ease', display: 'inline-block' }}
            className="hover:opacity-90">
            Hablar con ventas
          </a>
          <Link href="/onboarding"
            style={{ border: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.7)', padding: '13px 28px', borderRadius: '7px', fontSize: '14px', fontFamily: 'Inter, sans-serif', textDecoration: 'none', transition: 'border-color 0.15s ease', display: 'inline-block' }}
            className="hover:border-white/60">
            Ver demo
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════ */}
      <footer className="px-6 md:px-12"
        style={{ backgroundColor: C.bg, borderTop: `1px solid ${C.border}`, padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Logo />
          <span style={{ fontWeight: 500, fontSize: '14px', color: C.dark, fontFamily: 'Inter, sans-serif' }}>MixPower</span>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Privacidad', 'Términos', 'Contacto'].map(l => (
            <a key={l} href="#"
              style={{ fontSize: '13px', color: C.muted, fontFamily: 'Inter, sans-serif', textDecoration: 'none', transition: 'color 0.15s ease' }}
              className="hover:text-[#6B6B67]">
              {l}
            </a>
          ))}
        </div>
      </footer>

    </div>
  );
}
