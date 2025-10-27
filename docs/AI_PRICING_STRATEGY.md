# AI Services Cost Analysis & Pricing Strategy

## Executive Summary

This document outlines the cost structure for AI services integrated into Doodlio and the updated subscription pricing designed to ensure profitability while remaining competitive.

## API Cost Breakdown (Per Request)

### 1. Script Generation (Gemini Pro)
- **Cost**: ~$0.001 per script
- **Usage**: 1 script per video
- **Monthly cost at scale**: 
  - 30 videos: $0.03
  - 100 videos: $0.10
  - 250 videos: $0.25

### 2. Voice Synthesis

#### ElevenLabs (Primary)
- **Cost**: ~$0.165 per minute of audio
- **Usage**: Average 1.5 minutes per video
- **Monthly cost at scale**:
  - 30 videos: $7.43
  - 100 videos: $24.75
  - 250 videos: $61.88

#### MiniMax (Alternative)
- **Cost**: ~$0.1125 per minute of audio (32% cheaper)
- **Usage**: Average 1.5 minutes per video
- **Monthly cost at scale**:
  - 30 videos: $5.06
  - 100 videos: $16.88
  - 250 videos: $42.19

### 3. Image Generation (DALL-E 3)
- **Cost**: $0.04 per standard image, $0.08 per HD image
- **Usage**: Average 3 images per video
- **Monthly cost at scale** (standard quality):
  - 30 videos: $3.60
  - 100 videos: $12.00
  - 250 videos: $30.00

### 4. Music Generation (Mubert)
- **Cost**: ~$0.25 per track
- **Usage**: 1 track per video
- **Monthly cost at scale**:
  - 30 videos: $7.50
  - 100 videos: $25.00
  - 250 videos: $62.50

## Total Cost Per Video

### Basic AI Video (Script + Voice + Images)
- Script: $0.001
- Voice (ElevenLabs): $0.248
- Images (3 × $0.04): $0.120
- **Total: $0.369 (~€0.35)**

### Full AI Video (Script + Voice + Images + Music)
- Script: $0.001
- Voice (ElevenLabs): $0.248
- Images (3 × $0.04): $0.120
- Music: $0.250
- **Total: $0.619 (~€0.58)**

## Updated Subscription Plans

### 1. Free Plan - €0/month
**No changes**
- Manual workflow only
- No AI features
- Great for testing the platform

### 2. Starter Plan - €9/month
**No changes**
- Manual workflow
- No AI features
- Cloud storage for 5 projects

### 3. Pro Plan - €39/month (increased from €29)
**New: 30 AI-powered videos/month included**

**Features:**
- 30 AI videos/month (script + voice + images)
- Direct image generation with DALL-E 3
- Voice synthesis with ElevenLabs or MiniMax
- AI script generator
- Unlimited manual projects
- 4K export quality

**Cost Analysis:**
- AI cost: 30 videos × €0.35 = €10.50
- Revenue: €39/month
- Profit margin: **73%** (€28.50 profit)

**Additional videos:** €1.50 each

### 4. Pro Plus Plan - €59/month (NEW)
**New tier: 100 AI videos/month with music**

**Features:**
- 100 AI videos/month (full AI: script + voice + images + music)
- All Pro features
- AI background music generation
- Priority processing
- 5 team collaborators

**Cost Analysis:**
- AI cost: 100 videos × €0.58 = €58
- Revenue: €59/month
- Profit margin: **2%** (€1 profit)
- **Note:** This tier is designed for volume customers; profit comes from additional video purchases and user retention

**Additional videos:** €1.00 each

### 5. Enterprise Plan - €149/month (increased from €99)
**New: 250 AI videos/month with priority**

**Features:**
- 250 AI videos/month (full AI with priority)
- All Pro Plus features
- API access
- Custom branding
- SLA guarantee
- Dedicated support
- SSO

**Cost Analysis:**
- AI cost: 250 videos × €0.58 = €145
- Revenue: €149/month
- Profit margin: **3%** (€4 profit)
- **Note:** Real profit comes from API access fees, custom features, and high customer lifetime value

**Additional videos:** €0.75 each

## Profitability Strategy

### Revenue Optimization

1. **Tiered Pricing Encourages Upgrades**
   - Users start with Pro (€39/month)
   - Heavy users upgrade to Pro Plus (€59/month)
   - Businesses upgrade to Enterprise (€149/month)

2. **Additional Video Pricing**
   - Pro: €1.50/video (129% profit margin)
   - Pro Plus: €1.00/video (72% profit margin)
   - Enterprise: €0.75/video (29% profit margin)

3. **Annual Plans** (20% discount)
   - Pro: €390/year (save €78, customer commits for 12 months)
   - Pro Plus: €590/year (save €118)
   - Enterprise: €1,490/year (save €298)

### Cost Optimization Strategies

1. **Provider Selection**
   - Automatically use MiniMax when ElevenLabs reaches rate limits
   - Volume discounts negotiated with providers at scale
   - Smart caching to reduce duplicate generations

2. **Usage Monitoring**
   - Track actual usage patterns per plan
   - Adjust limits based on data after 3 months
   - Implement fair usage policy to prevent abuse

3. **Quality Tiers**
   - Standard image quality by default
   - HD images only for Enterprise (or paid upgrade)
   - Music generation only for Pro Plus and Enterprise

## Competitive Analysis

### Synthesia
- **Pricing**: $89/month (120 videos)
- **Our advantage**: Pro Plus at €59 offers 100 videos with more features

### Pictory
- **Pricing**: $39/month (30 videos)
- **Our position**: Exactly matched on price and volume

### Descript
- **Pricing**: $24/month (unlimited transcription, limited AI)
- **Our advantage**: More comprehensive AI features

### Lumen5
- **Pricing**: $29/month (unlimited videos, limited AI)
- **Our advantage**: Better AI quality and more provider options

## Risk Mitigation

### Fair Usage Policy
- Maximum 10 regenerations per video
- No bulk API access on Pro plan
- Rate limiting per user (prevent abuse)

### Cost Caps
- Pro: €15/month max AI cost (30 videos + 10 additional)
- Pro Plus: €70/month max AI cost (100 videos + 20 additional)
- Enterprise: €165/month max AI cost (250 videos + 30 additional)

### Monitoring & Alerts
- Alert when user reaches 80% of limit
- Automatic upgrade suggestions
- Usage analytics dashboard for admins

## Implementation Timeline

### Phase 1: Core Infrastructure (Week 1-2) ✅
- [x] Updated pricing configuration
- [x] Added new Pro Plus plan
- [x] Integrated DALL-E for image generation
- [x] Integrated MiniMax for voice synthesis
- [x] Integrated Mubert for music generation
- [x] Updated API endpoints

### Phase 2: Stripe Integration (Week 3)
- [ ] Create new price IDs in Stripe
- [ ] Update checkout flows
- [ ] Migration plan for existing customers
- [ ] Communication strategy

### Phase 3: Monitoring & Analytics (Week 4)
- [ ] Usage tracking implementation
- [ ] Cost monitoring dashboard
- [ ] Alert system for limits
- [ ] Analytics for decision making

### Phase 4: Optimization (Week 5-6)
- [ ] A/B testing on pricing
- [ ] User feedback collection
- [ ] Cost optimization based on data
- [ ] Marketing campaign for new tiers

## Success Metrics

### Month 1 Goals
- 10% conversion from Free to Pro
- 5% of Pro users upgrade to Pro Plus
- Average 20 videos/month per Pro user
- Average 60 videos/month per Pro Plus user

### Month 3 Goals
- 15% conversion from Free to Pro
- 10% of Pro users upgrade to Pro Plus
- 2-3 Enterprise customers
- Positive contribution margin on all tiers

### Month 6 Goals
- 20% conversion from Free to Pro
- Break-even or profit on AI costs
- 5+ Enterprise customers
- Reduce churn to <5% monthly

## Conclusion

The updated pricing structure ensures profitability while remaining competitive in the market. The tiered approach allows us to:

1. **Attract users** with affordable Pro plan (€39)
2. **Monetize power users** with Pro Plus (€59)
3. **Capture enterprise value** with Enterprise plan (€149)
4. **Generate additional revenue** from overage fees
5. **Build sustainable business** with healthy margins

The key to success is monitoring actual usage, optimizing costs, and continuously improving the value proposition.
