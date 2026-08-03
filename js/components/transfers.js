/* Transfer Market & Dynamic Interactive Negotiation Engine — Fast & Fun Mode */

import { state } from '../state.js';

export class TransferEngine {
  constructor() {
    this.activeNegotiation = null;
  }

  startNegotiation(player) {
    const val = player.val;
    const askingPrice = Math.round(val * (1.08 + Math.random() * 0.07)); // 108%-115% of val
    const minFee = Math.round(val * 0.92); // Lowest fee club will accept

    this.activeNegotiation = {
      player,
      askingPrice,
      minFee,
      currentOffer: val,
      stage: 'CLUB_FEE', // CLUB_FEE -> PLAYER_CHAT -> AGENT_CONTRACT -> COMPLETED
      clubCounters: 0,
      playerTalkTurns: 0,
      history: [],
      playerChatHistory: [],
      playerMood: 'neutral',
    };
    return this.activeNegotiation;
  }

  // ── STAGE 1: Balanced Club Fee Negotiation ──────────────────────────────
  submitFeeOffer(offerAmount) {
    const neg = this.activeNegotiation;
    if (!neg || neg.stage !== 'CLUB_FEE') return neg;

    neg.currentOffer = offerAmount;
    neg.history.push({
      sender: 'You',
      text: `We offer €${(offerAmount / 1000000).toFixed(1)}M for ${neg.player.name}.`,
      status: 'user'
    });

    const minAcceptable = neg.minFee || Math.round(neg.player.val * 0.90);

    if (offerAmount >= neg.askingPrice || offerAmount >= minAcceptable) {
      // Fee accepted! Move to player talk
      neg.stage = 'PLAYER_CHAT';
      neg.history.push({
        sender: 'Opposing Manager',
        text: `€${(offerAmount / 1000000).toFixed(1)}M is an acceptable offer. Deal agreed between clubs! You may now speak to ${neg.player.name} to discuss terms.`,
        status: 'accepted'
      });
    } else if (offerAmount < minAcceptable * 0.75) {
      // Insulting lowball
      neg.clubCounters++;
      if (neg.clubCounters >= 3) {
        neg.stage = 'FAILED';
        neg.history.push({
          sender: 'Opposing Manager',
          text: `That offer is insulting for a player of ${neg.player.name}'s quality. Negotiations are closed.`,
          status: 'failed'
        });
      } else {
        neg.history.push({
          sender: 'Opposing Manager',
          text: `€${(offerAmount / 1000000).toFixed(1)}M is far too low. We value ${neg.player.name} at €${(neg.askingPrice / 1000000).toFixed(1)}M. Please submit a serious proposal.`,
          status: 'counter'
        });
      }
    } else {
      // Counter offer: meeting halfway between offer and asking price
      neg.clubCounters++;
      if (neg.clubCounters >= 4) {
        neg.stage = 'FAILED';
        neg.history.push({
          sender: 'Opposing Manager',
          text: `We cannot find common ground on ${neg.player.name}'s fee. Negotiations terminated.`,
          status: 'failed'
        });
        return neg;
      }

      // Counter price is halfway between user offer and current asking price (never below user offer or min fee)
      let counterPrice = Math.round((neg.askingPrice + offerAmount) / 2);
      counterPrice = Math.max(counterPrice, minAcceptable);
      counterPrice = Math.max(counterPrice, offerAmount + 500000); // Always higher than user offer

      neg.askingPrice = counterPrice;
      neg.history.push({
        sender: 'Opposing Manager',
        text: `€${(offerAmount / 1000000).toFixed(1)}M is below our valuation. Our counter offer is €${(counterPrice / 1000000).toFixed(1)}M to let ${neg.player.name} leave.`,
        status: 'counter'
      });
    }

    return neg;
  }

  // ── STAGE 2: Player Conversation (In-Between Difficulty & Dialogue) ──────
  talkToPlayer(message) {
    const neg = this.activeNegotiation;
    if (!neg || neg.stage !== 'PLAYER_CHAT') return neg;

    const player = neg.player;
    const msg = message.toLowerCase();
    neg.playerTalkTurns++;

    neg.playerChatHistory.push({ sender: 'You', text: message, status: 'user' });

    const isAmbitious = msg.includes('trophy') || msg.includes('win') || msg.includes('champion') || msg.includes('title') || msg.includes('glory') || msg.includes('starter') || msg.includes('key') || msg.includes('role') || msg.includes('project') || msg.includes('vision') || msg.includes('future');
    const isNegative = msg.includes('bench') || msg.includes('reserve') || msg.includes('backup') || msg.includes('sub');

    if (isNegative) {
      neg.playerMood = 'skeptical';
      neg.playerChatHistory.push({
        sender: player.name,
        text: `A bench role? I'm aiming for starting football at this stage of my career. Convince me I'll be an important part of your plans.`,
        status: 'counter'
      });
    } else if (isAmbitious || neg.playerTalkTurns >= 2) {
      neg.playerMood = 'convinced';
      neg.stage = 'AGENT_CONTRACT';
      neg.playerChatHistory.push({
        sender: player.name,
        text: `That sounds like a great project, Manager! I'm convinced and excited to join. Let me put you in touch with my agent to finalize my contract.`,
        status: 'accepted'
      });
    } else {
      neg.playerChatHistory.push({
        sender: player.name,
        text: `I'm interested, but what specific role do you see for me in your tactical setup? Will I be competing for silverware?`,
        status: 'counter'
      });
    }

    return neg;
  }

  // ── STAGE 3: Agent Contract Negotiation (Balanced Demands) ───────────────
  submitContractOffer(wageOffer, contractYears) {
    const neg = this.activeNegotiation;
    if (!neg || neg.stage !== 'AGENT_CONTRACT') return neg;
    if (neg.stage === 'COMPLETED') return neg;

    // Target wage is ~105-115% of current wage (realistic raise)
    const targetWage = Math.round(neg.player.wage * 1.10);
    const minAcceptableWage = Math.round(neg.player.wage * 1.02);

    neg.history.push({
      sender: 'You',
      text: `We offer €${(wageOffer / 1000).toFixed(0)}k/wk for ${contractYears} years.`,
      status: 'user'
    });

    if (wageOffer >= targetWage || (wageOffer >= minAcceptableWage && neg.clubCounters >= 1)) {
      neg.stage = 'COMPLETED';
      neg.history.push({
        sender: `${neg.player.name}'s Agent`,
        text: `Excellent! €${(wageOffer / 1000).toFixed(0)}k/wk over ${contractYears} years is a fair deal. My client is delighted to sign!`,
        status: 'accepted'
      });
      this.completeTransfer(neg.player, neg.currentOffer, wageOffer, contractYears);
    } else if (wageOffer >= minAcceptableWage * 0.90) {
      neg.clubCounters++;
      neg.history.push({
        sender: `${neg.player.name}'s Agent`,
        text: `€${(wageOffer / 1000).toFixed(0)}k/wk is slightly below expectations. We expect at least €${(targetWage / 1000).toFixed(0)}k/wk for a player of his calibre.`,
        status: 'counter'
      });
    } else {
      neg.history.push({
        sender: `${neg.player.name}'s Agent`,
        text: `That wage proposal is uncompetitive. We require at least €${(targetWage / 1000).toFixed(0)}k/wk to proceed.`,
        status: 'counter'
      });
    }

    return neg;
  }

  completeTransfer(player, fee, wage, years = 4) {
    state.myClub.budget = Math.max(0, state.myClub.budget - fee);
    state.myClub.wageBudget = Math.max(0, state.myClub.wageBudget - wage);

    player.clubId = state.myClubId;
    player.wage = wage;
    player.morale = 95;

    state.bench.push(player);

    state.news.unshift({
      headline: `🔴 DONE DEAL: ${state.myClub.name} complete signing of ${player.name} for €${(fee / 1000000).toFixed(1)}M!`,
      date: state.getFormattedDate(),
      category: 'DONE DEAL'
    });

    state.playSound('goal');
    this.activeNegotiation = null;
  }
}

export const transferEngine = new TransferEngine();
